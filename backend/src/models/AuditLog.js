const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('AuditLog', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    action: { type: DataTypes.STRING, allowNull: false },
    resource_type: { type: DataTypes.STRING },
    resource_id: { type: DataTypes.STRING },
    old_values: { type: DataTypes.JSONB },
    new_values: { type: DataTypes.JSONB },
    ip_address: { type: DataTypes.STRING },
    user_agent: { type: DataTypes.STRING },
    status: { type: DataTypes.ENUM('success', 'failure'), defaultValue: 'success' }
  }, { tableName: 'audit_logs', underscored: true });
};