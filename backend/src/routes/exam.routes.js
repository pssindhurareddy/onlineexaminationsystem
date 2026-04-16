const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.post('/', requireRole(['admin', 'faculty']), examController.createExam);
router.put('/:id', requireRole(['admin', 'faculty']), examController.updateExam);
router.post('/:examId/questions', requireRole(['admin', 'faculty']), examController.addQuestionToExam);
router.delete('/questions/:id', requireRole(['admin', 'faculty']), examController.deleteQuestion);
router.get('/', requireRole(['admin', 'faculty', 'student']), examController.getExamsList);
router.get('/:id', requireRole(['admin', 'faculty', 'student']), examController.getExamDetails);
router.post('/:id/assign', requireRole(['admin', 'faculty']), examController.assignExam);
router.get('/:id/results', requireRole(['admin', 'faculty']), examController.getExamResults);
router.get('/:id/export', requireRole(['admin', 'faculty']), examController.exportExamResults);
router.patch('/attempts/:attemptId/answers/:answerId', requireRole(['admin', 'faculty']), examController.manualEvaluateAnswer);

module.exports = router;
