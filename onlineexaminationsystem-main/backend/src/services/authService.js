const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { redisClient } = require('../config/redis');
const { User, RefreshToken, OTP } = require('../models');

class AuthService {
  static generateAccessToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role, organization_id: user.organization_id },
      process.env.JWT_ACCESS_SECRET || 'your_access_secret_min_32_chars_long_enough',
      { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
    );
  }

  static async generateRefreshToken(user) {
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_min_32_chars_long_enough',
      { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.create({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt
    });

    return token;
  }

  static async verifyAccessToken(token) {
    // Check blacklist in Redis
    const isBlacklisted = await redisClient.get(`bl_${token}`);
    if (isBlacklisted) throw new Error('Token revoked');

    return jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'your_access_secret_min_32_chars_long_enough');
  }

  static async revokeAllTokens(userId) {
    await RefreshToken.update({ is_revoked: true }, { where: { user_id: userId } });
  }

  static async generateOTP(userId, type) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes

    await OTP.create({
      user_id: userId,
      otp_hash: otpHash,
      type,
      expires_at: expiresAt
    });
    
    // Also store in redis for quick lookup
    await redisClient.setEx(`otp_${userId}_${type}`, 600, otpHash);

    return otp;
  }
}

module.exports = AuthService;
