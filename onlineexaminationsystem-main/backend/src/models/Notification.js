const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Notification', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
    metadata: { type: DataTypes.JSONB }
  }, { tableName: 'notifications', underscored: true });
};