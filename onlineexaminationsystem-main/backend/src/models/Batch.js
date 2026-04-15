const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Batch', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    organization_id: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    year: { type: DataTypes.INTEGER, allowNull: false }
  }, { 
    tableName: 'batches', 
    underscored: true,
    indexes: [{ unique: true, fields: ['name', 'organization_id', 'year'] }]
  });
};