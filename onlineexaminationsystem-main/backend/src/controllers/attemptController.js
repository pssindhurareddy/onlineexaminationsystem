const { Exam, Question, ExamAttempt } = require('../models');
const EvaluationService = require('../services/evaluationService');

class AttemptController {

  static async startAttempt(req, res, next) {
    try {
      const { id } = req.params;
      // Verify exam existence and organization
      const exam = await Exam.findOne({
        where: { id, organization_id: req.user.organization_id },
        include: [
          { model: Question, attributes: ['id', 'text', 'type', 'options', 'marks'] }
        ]
      });

      if (!exam) return res.status(404).json({ success: false, message: 'Examination not found or unauthorized' });

      // Extract User constraints
      const user = await req.user;

      const currentTime = new Date();
      if (exam.scheduled_start && currentTime < new Date(exam.scheduled_start)) {
        return res.status(403).json({ success: false, message: 'This examination session has not commenced yet.' });
      }
      if (exam.scheduled_end && currentTime > new Date(exam.scheduled_end)) {
        return res.status(403).json({ success: false, message: 'This examination session has expired.' });
      }

      const attempt = await ExamAttempt.create({
        id: require('crypto').randomUUID(),
        exam_id: id,
        user_id: req.user.id,
        status: 'in_progress',
        started_at: new Date()
      });

      res.json({ success: true, data: { attemptId: attempt.id, exam, attempt } });
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
}

module.exports = AttemptController;
