const express = require('express');
const router = express.Router();
const attemptController = require('../controllers/attemptController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole(['student']));

router.get('/history', attemptController.getStudentHistory);
router.get('/exams/:id/attempt', attemptController.startAttempt);
router.post('/exams/:id/submit', attemptController.submitAttempt);
router.post('/attempts/:attemptId/auto-save', attemptController.autoSaveAnswer);
router.post('/attempts/:attemptId/tab-switch', attemptController.recordTabSwitch);

module.exports = router;
