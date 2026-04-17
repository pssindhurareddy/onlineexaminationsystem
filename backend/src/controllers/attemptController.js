const { Exam, Question, ExamAttempt, AttemptAnswer, Batch } = require('../models');
const EvaluationService = require('../services/evaluationService');

class AttemptController {

  static async startAttempt(req, res, next) {
    try {
      const { id } = req.params;

      // Verify exam existence and organization
      const exam = await Exam.findOne({
        where: { id, organization_id: req.user.organization_id },
        include: [
          { model: Question, attributes: ['id', 'text', 'type', 'options', 'marks'] },
          { model: Batch, as: 'AssignedSections' }
        ]
      });

      if (!exam) return res.status(404).json({ success: false, message: 'Examination not found or unauthorized' });

      // Verify exam is published/active
      if (exam.status === 'draft' || exam.status === 'cancelled') {
        return res.status(403).json({ success: false, message: 'This examination is not currently available.' });
      }

      // Enforce scheduling window
      const now = new Date();
      if (exam.scheduled_start && now < new Date(exam.scheduled_start)) {
        return res.status(403).json({ success: false, message: 'This examination has not started yet.', scheduledStart: exam.scheduled_start });
      }
      if (exam.scheduled_end && now > new Date(exam.scheduled_end)) {
        return res.status(403).json({ success: false, message: 'This examination has already ended.', scheduledEnd: exam.scheduled_end });
      }

      // Verify section assignment
      const userSections = await req.user.getBatches();
      const userSectionIds = userSections.map(b => b.id);
      const isAssigned = exam.AssignedSections.some(s => userSectionIds.includes(s.id));

      if (!isAssigned) {
        return res.status(403).json({ success: false, message: 'You are not authorized for this examination session' });
      }

      // Check for existing in-progress attempt
      const existingAttempt = await ExamAttempt.findOne({
        where: { exam_id: id, user_id: req.user.id, status: 'in_progress' }
      });
      if (existingAttempt) {
        // Resume existing attempt
        let questions = [...exam.Questions];
        if (exam.shuffle_questions) {
          questions = shuffleArray(questions, existingAttempt.id);
        }
        if (exam.shuffle_options) {
          questions = questions.map(q => shuffleOptions(q, existingAttempt.id));
        }
        const savedAnswers = await AttemptAnswer.findAll({ where: { attempt_id: existingAttempt.id } });
        const answersMap = {};
        savedAnswers.forEach(a => { answersMap[a.question_id] = a.selected_answer; });
        return res.json({ success: true, data: { attemptId: existingAttempt.id, exam: { ...exam.toJSON(), Questions: questions }, savedAnswers: answersMap } });
      }

      const attempt = await ExamAttempt.create({
        exam_id: id,
        user_id: req.user.id,
        status: 'in_progress',
        started_at: new Date(),
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });

      // Shuffle questions per-student if enabled
      let questions = [...exam.Questions];
      if (exam.shuffle_questions) {
        questions = shuffleArray(questions, attempt.id);
      }
      if (exam.shuffle_options) {
        questions = questions.map(q => shuffleOptions(q, attempt.id));
      }

      res.json({ success: true, data: { attemptId: attempt.id, exam: { ...exam.toJSON(), Questions: questions }, savedAnswers: {} } });
    } catch (err) {
      next(err);
    }
  }

  static async autoSaveAnswer(req, res, next) {
    try {
      const { attemptId } = req.params;
      const { questionId, answer } = req.body;

      const attempt = await ExamAttempt.findOne({ where: { id: attemptId, user_id: req.user.id, status: 'in_progress' } });
      if (!attempt) return res.status(404).json({ success: false, message: 'Active attempt not found' });

      await AttemptAnswer.upsert({
        attempt_id: attemptId,
        question_id: questionId,
        selected_answer: answer
      });

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  static async recordTabSwitch(req, res, next) {
    try {
      const { attemptId } = req.params;
      const attempt = await ExamAttempt.findOne({ where: { id: attemptId, user_id: req.user.id } });
      if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });

      await attempt.increment('tab_switch_count');
      res.json({ success: true, tabSwitchCount: attempt.tab_switch_count + 1 });
    } catch (err) {
      next(err);
    }
  }

  static async submitAttempt(req, res, next) {
    try {
      const { id } = req.params;
      const { attemptId, answers } = req.body;

      const result = await EvaluationService.evaluate(req.user.id, attemptId, id, answers);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getStudentHistory(req, res, next) {
    try {
      const { Op } = require('sequelize');
      const attempts = await ExamAttempt.findAll({
        where: {
          user_id: req.user.id,
          status: { [Op.in]: ['submitted', 'auto_submitted'] }
        },
        include: [{
          model: Exam,
          attributes: ['id', 'title', 'subject', 'total_marks', 'pass_marks', 'show_result_immediately', 'organization_id'],
          where: { organization_id: req.user.organization_id }
        }],
        order: [['submitted_at', 'DESC']]
      });
      res.json({ success: true, data: attempts });
    } catch (err) {
      next(err);
    }
  }
}

// Deterministic shuffle using attempt ID as seed
function shuffleArray(arr, seed) {
  const array = [...arr];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  for (let i = array.length - 1; i > 0; i--) {
    hash = ((hash << 5) - hash + i) | 0;
    const j = Math.abs(hash) % (i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function shuffleOptions(question, seed) {
  if (!question.options || question.options.length === 0) return question;
  const q = question.toJSON ? question.toJSON() : { ...question };
  const indices = q.options.map((_, i) => i);
  const shuffled = shuffleArray(indices, seed + q.id);
  q.options = shuffled.map(i => q.options[i]);
  // Map correct_answer indices to new positions
  if (Array.isArray(q.correct_answer)) {
    q.correct_answer = q.correct_answer.map(ca => shuffled.indexOf(ca));
  }
  return q;
}

module.exports = AttemptController;
