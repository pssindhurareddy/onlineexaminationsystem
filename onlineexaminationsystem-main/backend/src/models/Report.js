const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Report', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    type: { type: DataTypes.STRING, allowNull: false },
    filters: { type: DataTypes.JSONB },
    file_path: { type: DataTypes.STRING, allowNull: false }
  }, { tableName: 'reports', underscored: true });
};