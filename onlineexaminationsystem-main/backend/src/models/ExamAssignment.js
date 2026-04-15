const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('ExamAssignment', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    exam_id: { type: DataTypes.UUID, allowNull: false },
    batch_id: { type: DataTypes.UUID, allowNull: false }
  }, { tableName: 'exam_assignments', underscored: true });
};
