const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '../backend/src/models');
if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir, { recursive: true });

const models = [
  { name: 'User', content: `
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('student', 'faculty', 'admin'), defaultValue: 'student' },
    roll_number: { type: DataTypes.STRING },
    department: { type: DataTypes.STRING },
    profile_picture_url: { type: DataTypes.STRING },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    is_email_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    last_login_at: { type: DataTypes.DATE },
    failed_login_attempts: { type: DataTypes.INTEGER, defaultValue: 0 },
    locked_until: { type: DataTypes.DATE }
  }, { tableName: 'users', underscored: true });
};` },
  { name: 'RefreshToken', content: `
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('RefreshToken', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    token_hash: { type: DataTypes.STRING, allowNull: false },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    is_revoked: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, { tableName: 'refresh_tokens', underscored: true });
};` },
  { name: 'OTP', content: `
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('OTP', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    otp_hash: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.ENUM('email_verify', 'password_reset'), allowNull: false },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    is_used: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, { tableName: 'otps', underscored: true });
};` },
  { name: 'Department', content: `
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Department', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    code: { type: DataTypes.STRING, allowNull: false }
  }, { tableName: 'departments', underscored: true });
};` },
  { name: 'Batch', content: `
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Batch', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    year: { type: DataTypes.INTEGER, allowNull: false }
  }, { tableName: 'batches', underscored: true });
};` },
  { name: 'Question', content: `
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Question', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    text: { type: DataTypes.TEXT, allowNull: false },
    type: { type: DataTypes.ENUM('mcq', 'true_false', 'fill_blank'), allowNull: false },
    options: { type: DataTypes.JSONB },
    correct_answer: { type: DataTypes.JSONB, allowNull: false },
    explanation: { type: DataTypes.TEXT },
    subject: { type: DataTypes.STRING, allowNull: false },
    topic: { type: DataTypes.STRING },
    difficulty: { type: DataTypes.ENUM('easy', 'medium', 'hard'), defaultValue: 'medium' },
    blooms_level: { type: DataTypes.ENUM('remember', 'understand', 'apply', 'analyse', 'evaluate', 'create') },
    marks: { type: DataTypes.FLOAT, allowNull: false },
    negative_marks: { type: DataTypes.FLOAT, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, { tableName: 'questions', underscored: true });
};` },
  { name: 'Exam', content: `
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Exam', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
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
};` },
  { name: 'ExamAttempt', content: `
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
};` },
  { name: 'AttemptAnswer', content: `
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
};` },
  { name: 'Announcement', content: `
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Announcement', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    target_audience: { type: DataTypes.ENUM('all', 'students', 'faculty'), defaultValue: 'all' },
    priority: { type: DataTypes.ENUM('normal', 'important', 'urgent'), defaultValue: 'normal' },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, { tableName: 'announcements', underscored: true });
};` },
  { name: 'Notification', content: `
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Notification', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
    metadata: { type: DataTypes.JSONB }
  }, { tableName: 'notifications', underscored: true });
};` },
  { name: 'AuditLog', content: `
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('AuditLog', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    action: { type: DataTypes.STRING, allowNull: false },
    resource_type: { type: DataTypes.STRING },
    resource_id: { type: DataTypes.STRING },
    old_values: { type: DataTypes.JSONB },
    new_values: { type: DataTypes.JSONB },
    ip_address: { type: DataTypes.STRING },
    user_agent: { type: DataTypes.STRING },
    status: { type: DataTypes.ENUM('success', 'failure'), defaultValue: 'success' }
  }, { tableName: 'audit_logs', underscored: true });
};` },
  { name: 'Report', content: `
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Report', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    type: { type: DataTypes.STRING, allowNull: false },
    filters: { type: DataTypes.JSONB },
    file_path: { type: DataTypes.STRING, allowNull: false }
  }, { tableName: 'reports', underscored: true });
};` },
  { name: 'ExamQuestion', content: `
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('ExamQuestion', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    order_index: { type: DataTypes.INTEGER },
    marks_override: { type: DataTypes.FLOAT }
  }, { tableName: 'exam_questions', underscored: true });
};` },
  { name: 'ExamEnrollment', content: `
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('ExamEnrollment', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    enrolled_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, { tableName: 'exam_enrollments', underscored: true });
};` }
];

let indexJs = `const { sequelize } = require('../config/database');\n\n`;
models.forEach(m => {
  fs.writeFileSync(path.join(modelsDir, `${m.name}.js`), m.content.trim());
  indexJs += `const ${m.name} = require('./${m.name}')(sequelize);\n`;
});

indexJs += `\n// Associations\n`;

indexJs += `
// User Relations
User.hasMany(RefreshToken, { foreignKey: 'user_id' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(OTP, { foreignKey: 'user_id' });
OTP.belongsTo(User, { foreignKey: 'user_id' });

// Department & Batch
Department.hasMany(Batch, { foreignKey: 'department_id' });
Batch.belongsTo(Department, { foreignKey: 'department_id' });

User.belongsToMany(Batch, { through: 'user_batches', foreignKey: 'user_id', otherKey: 'batch_id' });
Batch.belongsToMany(User, { through: 'user_batches', foreignKey: 'batch_id', otherKey: 'user_id' });

// Questions & Exams
User.hasMany(Question, { foreignKey: 'created_by' });
Question.belongsTo(User, { foreignKey: 'created_by' });

User.hasMany(Exam, { foreignKey: 'created_by', as: 'CreatedExams' });
Exam.belongsTo(User, { foreignKey: 'created_by', as: 'Creator' });

User.hasMany(Exam, { foreignKey: 'peer_review_by', as: 'ReviewedExams' });
Exam.belongsTo(User, { foreignKey: 'peer_review_by', as: 'Reviewer' });

Exam.belongsToMany(Question, { through: ExamQuestion, foreignKey: 'exam_id', otherKey: 'question_id' });
Question.belongsToMany(Exam, { through: ExamQuestion, foreignKey: 'question_id', otherKey: 'exam_id' });

// Enrollments
Exam.belongsToMany(User, { through: ExamEnrollment, foreignKey: 'exam_id', otherKey: 'user_id' });
User.belongsToMany(Exam, { through: ExamEnrollment, foreignKey: 'user_id', otherKey: 'exam_id' });

// Attempts
Exam.hasMany(ExamAttempt, { foreignKey: 'exam_id' });
ExamAttempt.belongsTo(Exam, { foreignKey: 'exam_id' });

User.hasMany(ExamAttempt, { foreignKey: 'user_id' });
ExamAttempt.belongsTo(User, { foreignKey: 'user_id' });

ExamAttempt.hasMany(AttemptAnswer, { foreignKey: 'attempt_id' });
AttemptAnswer.belongsTo(ExamAttempt, { foreignKey: 'attempt_id' });

Question.hasMany(AttemptAnswer, { foreignKey: 'question_id' });
AttemptAnswer.belongsTo(Question, { foreignKey: 'question_id' });

User.hasMany(AttemptAnswer, { foreignKey: 'evaluator_id', as: 'EvaluatedAnswers' });
AttemptAnswer.belongsTo(User, { foreignKey: 'evaluator_id', as: 'Evaluator' });

// Utilities
User.hasMany(Announcement, { foreignKey: 'created_by' });
Announcement.belongsTo(User, { foreignKey: 'created_by' });

User.hasMany(Notification, { foreignKey: 'user_id' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(AuditLog, { foreignKey: 'user_id' });
AuditLog.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Report, { foreignKey: 'generated_by' });
Report.belongsTo(User, { foreignKey: 'generated_by' });
`;

indexJs += `\nmodule.exports = {
  sequelize,
  ${models.map(m => m.name).join(',\n  ')}
};\n`;

fs.writeFileSync(path.join(modelsDir, 'index.js'), indexJs);
console.log('Models generated successfully!');
