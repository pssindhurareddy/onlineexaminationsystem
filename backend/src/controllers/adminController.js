const { User, Exam, ExamAttempt, Batch, Department } = require('../models');
const bcrypt = require('bcrypt');

class AdminController {
  
  static async getAllUsers(req, res, next) {
    try {
      const users = await User.findAll({ 
        where: { 
          organization_id: req.user.organization_id,
          account_status: { [require('sequelize').Op.ne]: 'PENDING_APPROVAL' }
        },
        attributes: ['id', 'name', 'email', 'role', 'is_active', 'account_status', 'genesis_key', 'createdAt'],
        include: [{ model: Batch, through: { attributes: [] } }]
      });
      res.json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  }

  static async bulkProvisionIdentities(req, res, next) {
    const t = await require('../models').sequelize.transaction();
    try {
      const { users, role } = req.body; // users is an array of { name, email }
      const orgId = req.user.organization_id;
      const crypto = require('crypto');
      
      const results = [];
      for (const userData of users) {
        const { name, email } = userData;
        
        // Skip if already exists
        const existing = await User.findOne({ where: { email, organization_id: orgId } });
        if (existing) continue;

        const genesisKey = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 characters
        
        const user = await User.create({
          id: crypto.randomUUID(),
          organization_id: orgId,
          name,
          email,
          role: role || 'student',
          password_hash: 'PENDING_SETUP', // Marker for unactivated accounts
          account_status: 'PENDING_ACTIVATION',
          genesis_key: genesisKey,
          is_active: true
        }, { transaction: t });

        results.push({ name, email, genesisKey });
      }

      await t.commit();
      res.status(201).json({ success: true, data: results });
    } catch (err) {
      await t.rollback();
      next(err);
    }
  }

  static async getPendingRequests(req, res, next) {
    try {
      const requests = await User.findAll({
        where: { organization_id: req.user.organization_id, account_status: 'PENDING_APPROVAL' },
        attributes: ['id', 'name', 'email', 'role', 'createdAt']
      });
      res.json({ success: true, data: requests });
    } catch (err) {
      next(err);
    }
  }

  static async approveRequest(req, res, next) {
    try {
      const { id } = req.params;
      const user = await User.findOne({ where: { id, organization_id: req.user.organization_id } });
      if (!user) return res.status(404).json({ success: false, message: 'Request not found' });

      const crypto = require('crypto');
      const genesisKey = crypto.randomBytes(4).toString('hex').toUpperCase();
      
      user.account_status = 'PENDING_ACTIVATION';
      user.genesis_key = genesisKey;
      user.is_active = true;
      await user.save();

      // Dispatch Credentials Packet via Email
      const { sendMail } = require('../config/email');
      const { Organization } = require('../models');
      const org = await Organization.findByPk(req.user.organization_id);
      if (!org) return res.json({ success: true, message: 'Identity authorized. Email notification skipped (organization not found). Share the Genesis Key manually.', genesisKey });

      const html = `
        <div style="font-family: 'Inter', sans-serif; background: #050A15; color: white; padding: 40px; border-radius: 20px; max-width: 600px; margin: auto; border: 1px solid rgba(0,194,255,0.2);">
          <h1 style="color: #00C2FF; font-size: 24px;">Institutional Access Authorized</h1>
          <p style="color: #888; font-size: 14px;">Your identity request for <strong>${org.name}</strong> has been approved.</p>
          <div style="margin: 30px 0; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 12px; text-align: center; border: 1px dashed rgba(255,255,255,0.1);">
            <p style="color: #555; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">Genesis Activation Key</p>
            <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #00C2FF; font-family: monospace;">${genesisKey}</span>
          </div>
          <p style="color: #666; font-size: 12px;">Navigate to the institution portal and select 'Claim Identity' to finalize your credentials.</p>
          <div style="margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.05); pt-20px;">
             <p style="color: #444; font-size: 10px;">Identity Protocol: ExamPro v2.0</p>
          </div>
        </div>
      `;

      await sendMail(user.email, `Authorization Packet: ${org.name} Access Key`, html);

      res.json({ success: true, message: 'Identity authorized. Genesis Key dispatched via email.', genesisKey });
    } catch (err) {
      next(err);
    }
  }

  static async toggleUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const user = await User.findOne({ where: { id, organization_id: req.user.organization_id } });
      if (!user) return res.status(404).json({ success: false, message: 'Identity not found' });
      
      user.is_active = !user.is_active;
      await user.save();
      
      res.json({ success: true, message: `Status updated to ${user.is_active ? 'active' : 'suspended'}` });
    } catch (err) {
      next(err);
    }
  }

  static async getDashboardStats(req, res, next) {
    try {
      const orgId = req.user.organization_id;
      
      const [studentCount, facultyCount, examCount, attemptsData] = await Promise.all([
        User.count({ where: { organization_id: orgId, role: 'student' } }),
        User.count({ where: { organization_id: orgId, role: 'faculty' } }),
        Exam.count({ where: { organization_id: orgId } }),
        ExamAttempt.findAll({ 
          include: [{ 
            model: Exam, 
            where: { organization_id: orgId }, 
            attributes: ['pass_marks'] 
          }],
          attributes: ['total_score', ['created_at', 'createdAt']]
        })
      ]);
      
      const totalResults = attemptsData.length;
      const passedCount = attemptsData.filter(a => a.total_score >= (a.Exam?.pass_marks || 0)).length;
      const passRate = totalResults > 0 ? Math.round((passedCount / totalResults) * 100) : 0;

      res.json({
        success: true,
        data: {
          studentCount,
          facultyCount,
          examCount,
          passRate,
          systemLoad: 'Nominal'
        }
      });
    } catch (err) {
      next(err);
    }
  }

}

module.exports = AdminController;
