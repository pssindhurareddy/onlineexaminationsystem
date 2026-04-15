const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Organization', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, unique: true, allowNull: false },
    logo_url: { type: DataTypes.STRING },
    theme_color: { type: DataTypes.STRING, defaultValue: '#00C2FF' },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, { tableName: 'organizations', underscored: true });
};
