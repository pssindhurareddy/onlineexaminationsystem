const express = require('express');
const router = express.Router();
const { Department, Batch } = require('../models');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/courses', async (req, res, next) => {
  try {
    const courses = await Department.findAll({ where: { organization_id: req.user.organization_id } });
    res.json({ success: true, data: courses });
  } catch (error) {
    next(error);
  }
});

router.get('/sections', async (req, res, next) => {
  try {
    // Optionally filter by department_id if provided
    const where = { organization_id: req.user.organization_id };
    if (req.query.courseId) where.department_id = req.query.courseId;
    
    const sections = await Batch.findAll({ where });
    res.json({ success: true, data: sections });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
