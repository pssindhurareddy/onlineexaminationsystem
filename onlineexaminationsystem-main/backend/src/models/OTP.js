const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('OTP', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    otp_hash: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.ENUM('email_verify', 'password_reset'), allowNull: false },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    is_used: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, { tableName: 'otps', underscored: true });
};