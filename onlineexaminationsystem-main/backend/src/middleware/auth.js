const jwt = require('jsonwebtoken');
const { verifyAccessToken } = require('../services/authService');
const { User } = require('../models');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyAccessToken(token);
    
    req.user = await User.findByPk(decoded.id);
    if (!req.user || !req.user.is_active) {
      return res.status(401).json({ success: false, message: 'User inactive or not found' });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions' });
    }
    
    next();
  };
};

module.exports = { verifyToken, requireRole };
