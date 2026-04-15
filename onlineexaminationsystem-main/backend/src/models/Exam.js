const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Exam', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    organization_id: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    subject: { type: DataTypes.STRING, allowNull: false },
    instructions: { type: DataTypes.TEXT },
    total_marks: { type: DataTypes.FLOAT, allowNull: false },
    pass_marks: { type: DataTypes.FLOAT, allowNull: false },
    duration_minutes: { type: DataTypes.INTEGER, allowNull: false },
    max_attempts: { type: DataTypes.INTEGER, defaultValue: 1 },
    negative_marking_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    negative_marks_per_wrong: { type: DataTypes.FLOAT, defaultValue: 0 },
    shuffle_questions: { type: DataTypes.BOOLEAN, defaultValue: false },
    shuffle_options: { type: DataTypes.BOOLEAN, defaultValue: false },
    show_result_immediately: { type: DataTypes.BOOLEAN, defaultValue: true },
    show_answer_key: { type: DataTypes.BOOLEAN, defaultValue: true },
    leaderboard_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    status: { type: DataTypes.ENUM('draft', 'published', 'active', 'ended', 'cancelled'), defaultValue: 'draft' },
    scheduled_start: { type: DataTypes.DATE },
    scheduled_end: { type: DataTypes.DATE },
    peer_review_status: { type: DataTypes.ENUM('not_submitted', 'pending', 'approved', 'changes_requested'), defaultValue: 'not_submitted' },
    peer_review_comment: { type: DataTypes.TEXT }
  }, { tableName: 'exams', underscored: true });
};