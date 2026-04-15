const { Exam, Question, Attempt } = require('../models');
const EvaluationService = require('../services/evaluationService');

class AttemptController {
  
  static async startAttempt(req, res, next) {
    try {
      const { id } = req.params;
      const { Batch } = require('../models');

      // Verify exam existence and organization
      const exam = await Exam.findOne({ 
        where: { id, organization_id: req.user.organization_id },
        include: [
          { model: Question, attributes: ['id', 'text', 'type', 'options', 'marks'] },
          { model: Batch, as: 'AssignedSections' }
        ] 
      });
      
      if (!exam) return res.status(404).json({ success: false, message: 'Examination not found or unauthorized' });

      // Verify section assignment
      const userSections = await req.user.getBatches();
      const userSectionIds = userSections.map(b => b.id);
      const isAssigned = exam.AssignedSections.some(s => userSectionIds.includes(s.id));

      if (!isAssigned) {
        return res.status(403).json({ success: false, message: 'You are not authorized for this examination session' });
      }
      
      const attempt = await Attempt.create({
        id: require('crypto').randomUUID(),
        exam_id: id,
        user_id: req.user.id,
        status: 'in_progress',
        start_time: new Date()
      });

      res.json({ success: true, data: { attemptId: attempt.id, exam } });
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
