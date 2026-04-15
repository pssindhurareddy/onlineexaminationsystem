const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('ExamQuestion', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    order_index: { type: DataTypes.INTEGER },
    marks_override: { type: DataTypes.FLOAT }
  }, { tableName: 'exam_questions', underscored: true });
};