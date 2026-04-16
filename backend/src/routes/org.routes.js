const express = require('express');
const router = express.Router();
const { Department, Batch } = require('../models');
const AcademicController = require('../controllers/academicController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

// Academic Structure
router.get('/structure', AcademicController.getAcademicStructure);

// Departments (Courses)
router.get('/courses', async (req, res, next) => {
  try {
    const courses = await Department.findAll({ where: { organization_id: req.user.organization_id } });
    res.json({ success: true, data: courses });
  } catch (error) {
    next(error);
  }
});

router.post('/courses', requireRole(['admin']), AcademicController.createDepartment);

// Sections (Batches)
router.get('/sections', async (req, res, next) => {
  try {
    const where = { organization_id: req.user.organization_id };
    if (req.query.courseId) where.department_id = req.query.courseId;
    const sections = await Batch.findAll({ where });
    res.json({ success: true, data: sections });
  } catch (error) {
    next(error);
  }
});

router.post('/sections', requireRole(['admin']), AcademicController.createBatch);

// Faculty & Student Self-Service
router.post('/sections/subscribe', requireRole(['faculty', 'admin', 'student']), AcademicController.userSubscribe);

module.exports = router;
