const { Department, Batch, User, sequelize } = require('../models');
const { Op } = require('sequelize');

class AcademicController {

  static async createDepartment(req, res, next) {
    try {
      const { name, code } = req.body;
      if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Department name is required' });
      if (!code || !code.trim()) return res.status(400).json({ success: false, message: 'Department code is required' });
      const orgId = req.user.organization_id;

      const existing = await Department.findOne({ where: { organization_id: orgId, code: code.trim().toUpperCase() } });
      if (existing) return res.status(409).json({ success: false, message: `Department with code '${code.toUpperCase()}' already exists` });

      const department = await Department.create({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        organization_id: orgId
      });

      res.status(201).json({ success: true, data: department });
    } catch (err) {
      next(err);
    }
  }

  static async createBatch(req, res, next) {
    try {
      const { name, year, departmentId } = req.body;
      if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Section name is required' });
      if (!departmentId) return res.status(400).json({ success: false, message: 'Department is required' });
      const orgId = req.user.organization_id;

      const existing = await Batch.findOne({ where: { organization_id: orgId, department_id: departmentId, name: name.trim(), year: year || new Date().getFullYear() } });
      if (existing) return res.status(409).json({ success: false, message: `Section '${name}' already exists for this year` });

      const batch = await Batch.create({
        name: name.trim(),
        year: year || new Date().getFullYear(),
        department_id: departmentId,
        organization_id: orgId
      });

      res.status(201).json({ success: true, data: batch });
    } catch (err) {
      next(err);
    }
  }

  static async getAcademicStructure(req, res, next) {
    try {
      const orgId = req.user.organization_id;
      const structure = await Department.findAll({
        where: { organization_id: orgId },
        include: [{ model: Batch }]
      });
      res.json({ success: true, data: structure });
    } catch (err) {
      next(err);
    }
  }

  static async syncUserBatches(req, res, next) {
    try {
      const { userId, batchIds } = req.body;
      const orgId = req.user.organization_id;

      const user = await User.findOne({ where: { id: userId, organization_id: orgId } });
      if (!user) return res.status(404).json({ success: false, message: 'Identity not found' });

      const batches = await Batch.findAll({ 
        where: { 
          id: { [Op.in]: batchIds },
          organization_id: orgId
        }
      });

      await user.setBatches(batches);

      res.json({ success: true, message: 'Academic links synchronized' });
    } catch (err) {
      next(err);
    }
  }

  static async bulkEnroll(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const { emails, batchId } = req.body;
      const orgId = req.user.organization_id;

      const batch = await Batch.findOne({ where: { id: batchId, organization_id: orgId } });
      if (!batch) return res.status(404).json({ success: false, message: 'Section not found' });

      const users = await User.findAll({ 
        where: { 
          email: { [Op.in]: emails },
          organization_id: orgId
        }
      });

      for (const user of users) {
        await user.addBatch(batch, { transaction: t });
      }

      await t.commit();
      res.json({ success: true, message: `Successfully enrolled ${users.length} identities into ${batch.name}` });
    } catch (err) {
      await t.rollback();
      next(err);
    }
  }

  static async userSubscribe(req, res, next) {
    try {
      const { batchId } = req.body;
      const userId = req.user.id;
      const orgId = req.user.organization_id;

      const batch = await Batch.findOne({ where: { id: batchId, organization_id: orgId } });
      if (!batch) return res.status(404).json({ success: false, message: 'Section not found' });

      const user = await User.findByPk(userId);
      await user.addBatch(batch);

      res.json({ success: true, message: `Subscribed to ${batch.name}` });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AcademicController;
