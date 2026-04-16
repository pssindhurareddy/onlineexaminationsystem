const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.post('/', requireRole(['admin', 'faculty']), examController.createExam);
router.post('/:examId/questions', requireRole(['admin', 'faculty']), examController.addQuestionToExam);
router.get('/', requireRole(['admin', 'faculty', 'student']), examController.getExamsList);
router.get('/:id', requireRole(['admin', 'faculty', 'student']), examController.getExamDetails);
router.post('/:id/assign', requireRole(['admin', 'faculty']), examController.assignExam);

module.exports = router;
