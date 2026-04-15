const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    organization_id: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('student', 'faculty', 'admin', 'super_admin'), defaultValue: 'student' },
    roll_number: { type: DataTypes.STRING },
    department: { type: DataTypes.STRING },
    profile_picture_url: { type: DataTypes.STRING },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    is_email_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    account_status: { 
      type: DataTypes.ENUM('PENDING_ACTIVATION', 'ACTIVE', 'PENDING_APPROVAL', 'SUSPENDED'), 
      defaultValue: 'PENDING_ACTIVATION' 
    },
    genesis_key: { type: DataTypes.STRING, allowNull: true },
    last_login_at: { type: DataTypes.DATE },
    failed_login_attempts: { type: DataTypes.INTEGER, defaultValue: 0 },
    locked_until: { type: DataTypes.DATE }
  }, { 
    tableName: 'users', 
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['email', 'organization_id']
      }
    ],
    hooks: {
      beforeCreate: (user) => {
        if (user.account_status === 'PENDING_ACTIVATION' && !user.genesis_key) {
          const crypto = require('crypto');
          user.genesis_key = crypto.randomBytes(4).toString('hex').toUpperCase();
        }
      }
    }
  });
};