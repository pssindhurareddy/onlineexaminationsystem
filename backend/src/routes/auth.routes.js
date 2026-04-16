const express = require('express');
const router = express.Router();
const { loginLimiter } = require('../middleware/rateLimiter');
const bcrypt = require('bcrypt');
const AuthService = require('../services/authService');
const { User, OTP } = require('../models');
const { sendMail } = require('../config/email');

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password, orgSlug } = req.body;
    
    // Find Organization first
    const { Organization } = require('../models');
    let organizationId = null;
    
    if (orgSlug) {
      const org = await Organization.findOne({ where: { slug: orgSlug } });
      if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });
      organizationId = org.id;
    } else {
      // Internal system default or error - let's require orgSlug for the SaaS model
      return res.status(400).json({ success: false, message: 'Organization slug is required' });
    }

    const user = await User.findOne({ where: { email, organization_id: organizationId } });
    
    if (!user || !user.is_active) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    
    if (user.locked_until && user.locked_until > new Date()) {
      return res.status(423).json({ success: false, message: 'Account locked' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      console.warn(`[AUTH] Failed login attempt for ${email} in ${orgSlug}`);
      user.failed_login_attempts += 1;
      if (user.failed_login_attempts >= 5) {
        user.locked_until = new Date(Date.now() + 30 * 60000); 
      }
      await user.save();
      return res.status(401).json({ success: false, message: 'Invalid credentials. Please verify your identity packets.' });
    }

    user.failed_login_attempts = 0;
    user.locked_until = null;
    user.last_login_at = new Date();
    await user.save();

    const accessToken = AuthService.generateAccessToken(user);
    const refreshToken = await AuthService.generateRefreshToken(user);

    res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 3600000 });
    
    res.json({ success: true, data: { user: { id: user.id, name: user.name, role: user.role }, accessToken } });
  } catch (err) {
    next(err);
  }
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const otp = await AuthService.generateOTP(user.id, 'PASSWORD_RESET');
    const html = `
      <div style="font-family: Arial, sans-serif; background: #0A0F1E; color: white; padding: 40px; border-radius: 12px; text-align: center;">
        <h2 style="color: #00C2FF;">ExamPro Alert Protocol</h2>
        <p>A master reset was requested for this identity.</p>
        <div style="background: rgba(255,255,255,0.1); padding: 20px; font-size: 32px; letter-spacing: 12px; font-weight: bold; margin: 30px 0; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px;">
          ${otp}
        </div>
        <p style="color: #666; font-size: 12px;">Authentication expires in exactly 10 minutes. Do not share this packet.</p>
      </div>
    `;
    
    await sendMail(email, 'ExamPro Emergency Verification Key', html);
    
    res.json({ success: true, message: 'OTP deployed' });
  } catch (error) {
    next(error);
  }
});

router.post('/register-organization', async (req, res, next) => {
  const t = await require('../models').sequelize.transaction();
  try {
    const { name, slug, adminEmail, adminPassword } = req.body;
    const { Organization, User } = require('../models');

    // 1. Create Organization
    const org = await Organization.create({
      id: require('crypto').randomUUID(),
      name,
      slug
    }, { transaction: t });

    // 2. Create Admin User for this org
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await User.create({
      id: require('crypto').randomUUID(),
      organization_id: org.id,
      name: `${name} Admin`,
      email: adminEmail,
      password_hash: passwordHash,
      role: 'admin'
    }, { transaction: t });

    await t.commit();
    res.status(201).json({ success: true, message: 'Organization provisioned' });
  } catch (error) {
    await t.rollback();
    next(error);
  }
});

router.get('/organization/:slug', async (req, res, next) => {
  try {
    const { Organization } = require('../models');
    const org = await Organization.findOne({ where: { slug: req.params.slug } });
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });
    res.json({ success: true, data: org });
  } catch (error) {
    next(error);
  }
});

// --- Institutional Identity Protocol (IIS) ---

router.post('/request-access', async (req, res, next) => {
  try {
    const { name, email, orgSlug, role } = req.body;
    const { Organization, User } = require('../models');
    
    const org = await Organization.findOne({ where: { slug: orgSlug } });
    if (!org) return res.status(404).json({ success: false, message: 'Institution environment not found' });

    const existing = await User.findOne({ where: { email, organization_id: org.id } });
    if (existing) return res.status(400).json({ success: false, message: 'Identity already registered' });

    await User.create({
      id: require('crypto').randomUUID(),
      organization_id: org.id,
      name,
      email,
      role: role || 'faculty',
      password_hash: 'PENDING_APPROVAL_REQUEST',
      account_status: 'PENDING_APPROVAL',
      is_active: false
    });

    res.status(202).json({ success: true, message: 'Access request transmitted to institutional administrators.' });
  } catch (error) {
    next(error);
  }
});

router.post('/verify-genesis-key', async (req, res, next) => {
  try {
    const { email, genesisKey, orgSlug } = req.body;
    const { Organization, User } = require('../models');

    const org = await Organization.findOne({ where: { slug: orgSlug } });
    const user = await User.findOne({ 
      where: { 
        email, 
        genesis_key: genesisKey.toUpperCase(), 
        organization_id: org?.id,
        account_status: 'PENDING_ACTIVATION'
      } 
    });

    if (!user) return res.status(401).json({ success: false, message: 'Invalid genesis key or identity not found' });

    res.json({ success: true, data: { name: user.name } });
  } catch (error) {
    next(error);
  }
});

router.post('/activate-identity', async (req, res, next) => {
  try {
    const { email, genesisKey, password, orgSlug } = req.body;
    const { Organization, User } = require('../models');

    const org = await Organization.findOne({ where: { slug: orgSlug } });
    const user = await User.findOne({ 
      where: { 
        email, 
        genesis_key: genesisKey.toUpperCase(), 
        organization_id: org?.id,
        account_status: 'PENDING_ACTIVATION'
      } 
    });

    if (!user) return res.status(401).json({ success: false, message: 'Authorization expired or invalid' });

    const passwordHash = await bcrypt.hash(password, 12);
    user.password_hash = passwordHash;
    user.account_status = 'ACTIVE';
    user.genesis_key = null;
    user.is_active = true;
    user.failed_login_attempts = 0; // Reset for security fresh start
    await user.save();

    res.json({ success: true, message: 'Institutional identity successfully established.' });
  } catch (error) {
    next(error);
  }
});

const { verifyToken } = require('../middleware/auth');
const { Batch } = require('../models');

router.get('/me', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'role', 'account_status', 'is_active'],
      include: [{ model: Batch, through: { attributes: [] } }]
    });
    
    if (!user) return res.status(404).json({ success: false, message: 'Identity not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
