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
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    organization_id: { type: DataTypes.UUID, allowNull: false },
    created_by: { type: DataTypes.UUID, allowNull: false }
  }, { tableName: 'questions', underscored: true });
};