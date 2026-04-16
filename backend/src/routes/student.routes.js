const express = require('express');
const router = express.Router();
const attemptController = require('../controllers/attemptController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole(['student']));

router.get('/exams/:id/attempt', attemptController.startAttempt);
router.post('/exams/:id/submit', attemptController.submitAttempt);
router.post('/attempts/:attemptId/auto-save', attemptController.autoSaveAnswer);
router.post('/attempts/:attemptId/tab-switch', attemptController.recordTabSwitch);
router.get('/my-attempts', attemptController.getMyAttempts);

module.exports = router;
