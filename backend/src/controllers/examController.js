const { Exam, Question, ExamQuestion, Batch, User } = require('../models');

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
      include: [Question] 
    });
    if (!exam) return res.status(404).json({ success: false, message: 'Examination not found' });
    res.json({ success: true, data: exam });
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
