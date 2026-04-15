const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.post('/', requireRole(['admin', 'faculty']), examController.createExam);
router.post('/:examId/questions', requireRole(['admin', 'faculty']), examController.addQuestionToExam);
router.get('/subjects', requireRole(['admin', 'faculty', 'student']), examController.getSubjectsList);
router.get('/', requireRole(['admin', 'faculty', 'student']), examController.getExamsList);
router.get('/:id', requireRole(['admin', 'faculty', 'student']), examController.getExamDetails);
router.delete('/questions/:id', requireRole(['admin', 'faculty']), examController.deleteQuestion);
router.delete('/:id', requireRole(['admin', 'faculty']), examController.deleteExam);
router.put('/:id/settings', requireRole(['admin', 'faculty']), examController.updateExamSettings);

module.exports = router;
