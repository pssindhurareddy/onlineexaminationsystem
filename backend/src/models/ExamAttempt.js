const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('ExamAttempt', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    attempt_number: { type: DataTypes.INTEGER, defaultValue: 1 },
    started_at: { type: DataTypes.DATE },
    submitted_at: { type: DataTypes.DATE },
    time_taken_seconds: { type: DataTypes.INTEGER },
    status: { type: DataTypes.ENUM('in_progress', 'submitted', 'auto_submitted', 'timed_out'), defaultValue: 'in_progress' },
    total_score: { type: DataTypes.FLOAT },
    percentage: { type: DataTypes.FLOAT },
    grade: { type: DataTypes.STRING },
    rank: { type: DataTypes.INTEGER },
    percentile: { type: DataTypes.FLOAT },
    tab_switch_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    flagged_questions: { type: DataTypes.JSONB },
    ip_address: { type: DataTypes.STRING },
    user_agent: { type: DataTypes.STRING }
  }, { tableName: 'exam_attempts', underscored: true });
};