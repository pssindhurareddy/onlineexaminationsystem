const { Exam, Question, ExamQuestion, Batch, User, ExamAttempt, AttemptAnswer } = require('../models');

exports.createExam = async (req, res, next) => {
  try {
    const { title, subject, instructions, total_marks, pass_marks, duration_minutes, settings, assignedSections } = req.body;
    
    const exam = await Exam.create({
      title,
      subject,
      instructions,
      total_marks: total_marks || 100,
      pass_marks: pass_marks || 40,
      duration_minutes: duration_minutes || 60,
      status: 'draft',
      created_by: req.user.id,
      organization_id: req.user.organization_id,
      ...(settings || {})
    });

    if (assignedSections && Array.isArray(assignedSections)) {
      await exam.setAssignedSections(assignedSections);
    }

    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    next(error);
  }
};

exports.updateExam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title, subject, instructions, total_marks, pass_marks, duration_minutes, status,
      scheduled_start, scheduled_end,
      negative_marking_enabled, negative_marks_per_wrong,
      shuffle_questions, shuffle_options,
      show_result_immediately, show_answer_key, max_attempts,
      assignedSections
    } = req.body;

    const exam = await Exam.findOne({ where: { id, organization_id: req.user.organization_id } });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (req.user.role === 'faculty' && exam.created_by !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await exam.update({
      ...(title !== undefined && { title }),
      ...(subject !== undefined && { subject }),
      ...(instructions !== undefined && { instructions }),
      ...(total_marks !== undefined && { total_marks }),
      ...(pass_marks !== undefined && { pass_marks }),
      ...(duration_minutes !== undefined && { duration_minutes }),
      ...(status !== undefined && { status }),
      ...(scheduled_start !== undefined && { scheduled_start }),
      ...(scheduled_end !== undefined && { scheduled_end }),
      ...(negative_marking_enabled !== undefined && { negative_marking_enabled }),
      ...(negative_marks_per_wrong !== undefined && { negative_marks_per_wrong }),
      ...(shuffle_questions !== undefined && { shuffle_questions }),
      ...(shuffle_options !== undefined && { shuffle_options }),
      ...(show_result_immediately !== undefined && { show_result_immediately }),
      ...(show_answer_key !== undefined && { show_answer_key }),
      ...(max_attempts !== undefined && { max_attempts })
    });

    if (assignedSections !== undefined && Array.isArray(assignedSections)) {
      await exam.setAssignedSections(assignedSections);
    }

    res.json({ success: true, data: exam });
  } catch (error) {
    next(error);
  }
};

exports.addQuestionToExam = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const { text, type, options, correct_answer, marks, subject, explanation } = req.body;

    const question = await Question.create({
      text,
      type,
      options,
      correct_answer,
      marks,
      subject,
      explanation,
      created_by: req.user.id,
      organization_id: req.user.organization_id
    });

    await ExamQuestion.create({
      exam_id: examId,
      question_id: question.id,
      order_index: req.body.order_index || 1
    });

    res.status(201).json({ success: true, data: question });
  } catch (error) {
    next(error);
  }
};

exports.getExamsList = async (req, res, next) => {
  try {
    const where = { organization_id: req.user.organization_id };
    
    if (req.user.role === 'faculty') {
      where.created_by = req.user.id;
    }

    let include = [];
    if (req.user.role === 'student') {
      // Find sections the student belongs to
      const user = await User.findByPk(req.user.id, { include: [Batch] });
      const sectionIds = user.Batches.map(b => b.id);
      
      include.push({
        model: Batch,
        as: 'AssignedSections',
        where: { id: sectionIds },
        required: true // Only return exams assigned to these sections
      });
    } else {
      include.push({ model: Batch, as: 'AssignedSections' });
    }

    const exams = await Exam.findAll({ where, include, order: [['created_at', 'DESC']] });
    res.json({ success: true, data: exams });
  } catch (error) {
    next(error);
  }
};

exports.getExamDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findOne({ 
      where: { id, organization_id: req.user.organization_id }, 
      include: [{ model: Question }, { model: Batch, as: 'AssignedSections' }]
    });
    if (!exam) return res.status(404).json({ success: false, message: 'Examination not found' });
    res.json({ success: true, data: exam });
  } catch (err) {
    next(err);
  }
};

exports.getExamResults = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findOne({ where: { id, organization_id: req.user.organization_id } });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (req.user.role === 'faculty' && exam.created_by !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const attempts = await ExamAttempt.findAll({
      where: { exam_id: id },
      include: [
        { model: User, attributes: ['id', 'name', 'email'] },
        { model: AttemptAnswer, include: [{ model: Question, attributes: ['id', 'text', 'type', 'correct_answer', 'marks', 'options'] }] }
      ],
      order: [['submitted_at', 'DESC']]
    });

    const stats = {
      total: attempts.filter(a => a.status !== 'in_progress').length,
      inProgress: attempts.filter(a => a.status === 'in_progress').length,
      avgScore: 0,
      highestScore: 0,
      lowestScore: null,
      avgTimeSecs: 0
    };

    const completed = attempts.filter(a => a.total_score !== null && a.status !== 'in_progress');
    if (completed.length > 0) {
      const scores = completed.map(a => a.total_score);
      stats.avgScore = parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));
      stats.highestScore = Math.max(...scores);
      stats.lowestScore = Math.min(...scores);
      const times = completed.filter(a => a.time_taken_seconds).map(a => a.time_taken_seconds);
      if (times.length > 0) {
        stats.avgTimeSecs = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      }
    }

    res.json({ success: true, data: { exam, attempts, stats } });
  } catch (err) {
    next(err);
  }
};

exports.exportExamResults = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findOne({ where: { id, organization_id: req.user.organization_id } });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (req.user.role === 'faculty' && exam.created_by !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const attempts = await ExamAttempt.findAll({
      where: { exam_id: id },
      include: [{ model: User, attributes: ['name', 'email'] }],
      order: [['submitted_at', 'DESC']]
    });

    const header = 'Name,Email,Score,Percentage,Passed,Status,Time Taken (secs),Tab Switches,Started At,Submitted At\n';
    const rows = attempts.map(a => {
      const name = (a.User?.name || '').replace(/,/g, ' ');
      const email = a.User?.email || '';
      const score = a.total_score ?? '';
      const pct = a.percentage ?? '';
      const passed = a.total_score !== null ? (a.total_score >= exam.pass_marks ? 'Yes' : 'No') : '';
      const status = a.status;
      const timeTaken = a.time_taken_seconds ?? '';
      const tabSwitches = a.tab_switch_count ?? 0;
      const startedAt = a.started_at ? new Date(a.started_at).toISOString() : '';
      const submittedAt = a.submitted_at ? new Date(a.submitted_at).toISOString() : '';
      return `${name},${email},${score},${pct},${passed},${status},${timeTaken},${tabSwitches},${startedAt},${submittedAt}`;
    });

    const csv = header + rows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="exam_results_${id}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

exports.deleteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const question = await Question.findOne({ 
      where: { id, organization_id: req.user.organization_id } 
    });

    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    
    // Revoke from all exams first (cascading cleanup)
    await ExamQuestion.destroy({ where: { question_id: id } });
    await question.destroy();

    res.json({ success: true, message: 'Question revoked from institutional registry.' });
  } catch (err) {
    next(err);
  }
};

exports.assignExam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assignedSections } = req.body;
    
    const exam = await Exam.findOne({ 
      where: { id, organization_id: req.user.organization_id } 
    });

    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    if (assignedSections && Array.isArray(assignedSections)) {
      await exam.setAssignedSections(assignedSections);
    }

    res.json({ success: true, message: 'Institutional cohorts authorized for this protocol.' });
  } catch (err) {
    next(err);
  }
};

exports.manualEvaluateAnswer = async (req, res, next) => {
  try {
    const { attemptId, answerId } = req.params;
    const { marks_awarded, evaluator_comment } = req.body;

    const answer = await AttemptAnswer.findOne({ where: { id: answerId, attempt_id: attemptId } });
    if (!answer) return res.status(404).json({ success: false, message: 'Answer record not found' });

    const attempt = await ExamAttempt.findByPk(attemptId);
    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });

    // Verify faculty owns the exam
    const exam = await Exam.findOne({ where: { id: attempt.exam_id, organization_id: req.user.organization_id } });
    if (!exam) return res.status(403).json({ success: false, message: 'Unauthorized' });
    if (req.user.role === 'faculty' && exam.created_by !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const oldMarks = answer.marks_awarded || 0;
    await answer.update({
      marks_awarded: Number(marks_awarded),
      evaluator_comment: evaluator_comment || null,
      manually_evaluated: true,
      is_correct: Number(marks_awarded) > 0
    });

    // Recalculate attempt total score
    const allAnswers = await AttemptAnswer.findAll({ where: { attempt_id: attemptId } });
    const newTotal = Math.max(0, allAnswers.reduce((sum, a) => sum + (a.marks_awarded || 0), 0));
    const percentage = exam.total_marks > 0 ? parseFloat(((newTotal / exam.total_marks) * 100).toFixed(2)) : 0;
    await attempt.update({ total_score: newTotal, percentage });

    res.json({ success: true, data: { marks_awarded: Number(marks_awarded), newTotal, percentage } });
  } catch (err) {
    next(err);
  }
};


