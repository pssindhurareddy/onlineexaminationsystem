const express = require('express');
const router = express.Router();
const attemptController = require('../controllers/attemptController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole(['student']));

router.get('/exams/:id/attempt', attemptController.startAttempt);
router.post('/exams/:id/submit', attemptController.submitAttempt);

router.put('/subjects', async (req, res, next) => {
    try {
        const { User } = require('../models');
        const { subjects } = req.body;
        await User.update({ subjects: subjects || [] }, { where: { id: req.user.id } });
        res.json({ success: true, message: 'Subjects updated successfully' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
