const { sequelize } = require('../config/database');

const Organization = require('./Organization')(sequelize);
const User = require('./User')(sequelize);
const RefreshToken = require('./RefreshToken')(sequelize);
const OTP = require('./OTP')(sequelize);
const Department = require('./Department')(sequelize);
const Batch = require('./Batch')(sequelize);
const Question = require('./Question')(sequelize);
const Exam = require('./Exam')(sequelize);
const ExamAssignment = require('./ExamAssignment')(sequelize);
const ExamAttempt = require('./ExamAttempt')(sequelize);
const AttemptAnswer = require('./AttemptAnswer')(sequelize);
const Announcement = require('./Announcement')(sequelize);
const Notification = require('./Notification')(sequelize);
const AuditLog = require('./AuditLog')(sequelize);
const Report = require('./Report')(sequelize);
const ExamQuestion = require('./ExamQuestion')(sequelize);
const ExamEnrollment = require('./ExamEnrollment')(sequelize);

// Associations

// Organization Hierarchy
Organization.hasMany(User, { foreignKey: 'organization_id' });
User.belongsTo(Organization, { foreignKey: 'organization_id' });

Organization.hasMany(Exam, { foreignKey: 'organization_id' });
Exam.belongsTo(Organization, { foreignKey: 'organization_id' });

Organization.hasMany(Department, { foreignKey: 'organization_id' });
Department.belongsTo(Organization, { foreignKey: 'organization_id' });

Organization.hasMany(Batch, { foreignKey: 'organization_id' });
Batch.belongsTo(Organization, { foreignKey: 'organization_id' });

// User Relations
User.hasMany(RefreshToken, { foreignKey: 'user_id' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(OTP, { foreignKey: 'user_id' });
OTP.belongsTo(User, { foreignKey: 'user_id' });

// Course (Department) & Section (Batch)
Department.hasMany(Batch, { foreignKey: 'department_id' });
Batch.belongsTo(Department, { foreignKey: 'department_id' });

User.belongsToMany(Batch, { through: 'user_batches', foreignKey: 'user_id', otherKey: 'batch_id' });
Batch.belongsToMany(User, { through: 'user_batches', foreignKey: 'batch_id', otherKey: 'user_id' });

// Exam Assignments (to Sections/Batches)
Exam.belongsToMany(Batch, { through: ExamAssignment, foreignKey: 'exam_id', otherKey: 'batch_id', as: 'AssignedSections' });
Batch.belongsToMany(Exam, { through: ExamAssignment, foreignKey: 'batch_id', otherKey: 'exam_id' });

// Questions & Exams
User.hasMany(Question, { foreignKey: 'created_by' });
Question.belongsTo(User, { foreignKey: 'created_by' });

User.hasMany(Exam, { foreignKey: 'created_by', as: 'CreatedExams' });
Exam.belongsTo(User, { foreignKey: 'created_by', as: 'Creator' });

User.hasMany(Exam, { foreignKey: 'peer_review_by', as: 'ReviewedExams' });
Exam.belongsTo(User, { foreignKey: 'peer_review_by', as: 'Reviewer' });

Exam.belongsToMany(Question, { through: ExamQuestion, foreignKey: 'exam_id', otherKey: 'question_id' });
Question.belongsToMany(Exam, { through: ExamQuestion, foreignKey: 'question_id', otherKey: 'exam_id' });

// Enrollments (Explicit User Enrollment)
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

module.exports = {
  sequelize,
  Organization,
  User,
  RefreshToken,
  OTP,
  Department,
  Batch,
  Question,
  Exam,
  ExamAssignment,
  ExamAttempt,
  AttemptAnswer,
  Announcement,
  Notification,
  AuditLog,
  Report,
  ExamQuestion,
  ExamEnrollment
};
