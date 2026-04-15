const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Department', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    organization_id: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    code: { type: DataTypes.STRING, allowNull: false }
  }, { 
    tableName: 'departments', 
    underscored: true,
    indexes: [{ unique: true, fields: ['name', 'organization_id'] }, { unique: true, fields: ['code', 'organization_id'] }]
  });
};