const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('ExamEnrollment', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    enrolled_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, { tableName: 'exam_enrollments', underscored: true });
};