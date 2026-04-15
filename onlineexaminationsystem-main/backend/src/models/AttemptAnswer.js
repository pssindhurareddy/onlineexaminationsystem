const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('AttemptAnswer', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    selected_answer: { type: DataTypes.JSONB },
    is_correct: { type: DataTypes.BOOLEAN },
    marks_awarded: { type: DataTypes.FLOAT },
    is_marked_for_review: { type: DataTypes.BOOLEAN, defaultValue: false },
    time_spent_seconds: { type: DataTypes.INTEGER, defaultValue: 0 },
    manually_evaluated: { type: DataTypes.BOOLEAN, defaultValue: false },
    evaluator_comment: { type: DataTypes.TEXT }
  }, { tableName: 'attempt_answers', underscored: true });
};