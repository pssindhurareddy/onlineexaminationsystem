const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Announcement', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    target_audience: { type: DataTypes.ENUM('all', 'students', 'faculty'), defaultValue: 'all' },
    priority: { type: DataTypes.ENUM('normal', 'important', 'urgent'), defaultValue: 'normal' },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, { tableName: 'announcements', underscored: true });
};