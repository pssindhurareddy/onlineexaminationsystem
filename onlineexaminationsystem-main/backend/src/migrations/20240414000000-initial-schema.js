'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('departments', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      code: { type: Sequelize.STRING, allowNull: false },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    await queryInterface.createTable('batches', {
      id: { type: Sequelize.UUID, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      year: { type: Sequelize.INTEGER, allowNull: false },
      department_id: { type: Sequelize.INTEGER, references: { model: 'departments', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    await queryInterface.createTable('users', {
      id: { type: Sequelize.UUID, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, unique: true, allowNull: false },
      password_hash: { type: Sequelize.STRING, allowNull: false },
      role: { type: Sequelize.ENUM('student', 'faculty', 'admin'), defaultValue: 'student' },
      roll_number: { type: Sequelize.STRING },
      department: { type: Sequelize.STRING },
      profile_picture_url: { type: Sequelize.STRING },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      is_email_verified: { type: Sequelize.BOOLEAN, defaultValue: false },
      last_login_at: { type: Sequelize.DATE },
      failed_login_attempts: { type: Sequelize.INTEGER, defaultValue: 0 },
      locked_until: { type: Sequelize.DATE },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    await queryInterface.createTable('user_batches', {
      user_id: { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE', primaryKey: true },
      batch_id: { type: Sequelize.UUID, references: { model: 'batches', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE', primaryKey: true },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    await queryInterface.createTable('refresh_tokens', {
      id: { type: Sequelize.UUID, primaryKey: true },
      user_id: { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      token_hash: { type: Sequelize.STRING, allowNull: false },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      is_revoked: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    await queryInterface.createTable('otps', {
      id: { type: Sequelize.UUID, primaryKey: true },
      user_id: { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      otp_hash: { type: Sequelize.STRING, allowNull: false },
      type: { type: Sequelize.ENUM('email_verify', 'password_reset'), allowNull: false },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      is_used: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    await queryInterface.createTable('questions', {
      id: { type: Sequelize.UUID, primaryKey: true },
      text: { type: Sequelize.TEXT, allowNull: false },
      type: { type: Sequelize.ENUM('mcq', 'true_false', 'fill_blank'), allowNull: false },
      options: { type: Sequelize.JSONB },
      correct_answer: { type: Sequelize.JSONB, allowNull: false },
      explanation: { type: Sequelize.TEXT },
      subject: { type: Sequelize.STRING, allowNull: false },
      topic: { type: Sequelize.STRING },
      difficulty: { type: Sequelize.ENUM('easy', 'medium', 'hard'), defaultValue: 'medium' },
      blooms_level: { type: Sequelize.ENUM('remember', 'understand', 'apply', 'analyse', 'evaluate', 'create') },
      marks: { type: Sequelize.FLOAT, allowNull: false },
      negative_marks: { type: Sequelize.FLOAT, defaultValue: 0 },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_by: { type: Sequelize.UUID, references: { model: 'users', key: 'id' } },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    await queryInterface.createTable('exams', {
      id: { type: Sequelize.UUID, primaryKey: true },
      title: { type: Sequelize.STRING, allowNull: false },
      subject: { type: Sequelize.STRING, allowNull: false },
      instructions: { type: Sequelize.TEXT },
      total_marks: { type: Sequelize.FLOAT, allowNull: false },
      pass_marks: { type: Sequelize.FLOAT, allowNull: false },
      duration_minutes: { type: Sequelize.INTEGER, allowNull: false },
      max_attempts: { type: Sequelize.INTEGER, defaultValue: 1 },
      negative_marking_enabled: { type: Sequelize.BOOLEAN, defaultValue: false },
      negative_marks_per_wrong: { type: Sequelize.FLOAT, defaultValue: 0 },
      shuffle_questions: { type: Sequelize.BOOLEAN, defaultValue: false },
      shuffle_options: { type: Sequelize.BOOLEAN, defaultValue: false },
      show_result_immediately: { type: Sequelize.BOOLEAN, defaultValue: true },
      show_answer_key: { type: Sequelize.BOOLEAN, defaultValue: true },
      leaderboard_enabled: { type: Sequelize.BOOLEAN, defaultValue: false },
      status: { type: Sequelize.ENUM('draft', 'published', 'active', 'ended', 'cancelled'), defaultValue: 'draft' },
      scheduled_start: { type: Sequelize.DATE },
      scheduled_end: { type: Sequelize.DATE },
      created_by: { type: Sequelize.UUID, references: { model: 'users', key: 'id' } },
      peer_review_status: { type: Sequelize.ENUM('not_submitted', 'pending', 'approved', 'changes_requested'), defaultValue: 'not_submitted' },
      peer_review_by: { type: Sequelize.UUID, references: { model: 'users', key: 'id' } },
      peer_review_comment: { type: Sequelize.TEXT },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    await queryInterface.createTable('exam_questions', {
      id: { type: Sequelize.UUID, primaryKey: true },
      exam_id: { type: Sequelize.UUID, references: { model: 'exams', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      question_id: { type: Sequelize.UUID, references: { model: 'questions', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      order_index: { type: Sequelize.INTEGER },
      marks_override: { type: Sequelize.FLOAT },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    await queryInterface.createTable('exam_enrollments', {
      id: { type: Sequelize.UUID, primaryKey: true },
      exam_id: { type: Sequelize.UUID, references: { model: 'exams', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      user_id: { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      enrolled_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    await queryInterface.createTable('exam_attempts', {
      id: { type: Sequelize.UUID, primaryKey: true },
      exam_id: { type: Sequelize.UUID, references: { model: 'exams', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      user_id: { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      attempt_number: { type: Sequelize.INTEGER, defaultValue: 1 },
      started_at: { type: Sequelize.DATE },
      submitted_at: { type: Sequelize.DATE },
      time_taken_seconds: { type: Sequelize.INTEGER },
      status: { type: Sequelize.ENUM('in_progress', 'submitted', 'auto_submitted', 'timed_out'), defaultValue: 'in_progress' },
      total_score: { type: Sequelize.FLOAT },
      percentage: { type: Sequelize.FLOAT },
      grade: { type: Sequelize.STRING },
      rank: { type: Sequelize.INTEGER },
      percentile: { type: Sequelize.FLOAT },
      tab_switch_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      flagged_questions: { type: Sequelize.JSONB },
      ip_address: { type: Sequelize.STRING },
      user_agent: { type: Sequelize.STRING },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    await queryInterface.createTable('attempt_answers', {
      id: { type: Sequelize.UUID, primaryKey: true },
      attempt_id: { type: Sequelize.UUID, references: { model: 'exam_attempts', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      question_id: { type: Sequelize.UUID, references: { model: 'questions', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      selected_answer: { type: Sequelize.JSONB },
      is_correct: { type: Sequelize.BOOLEAN },
      marks_awarded: { type: Sequelize.FLOAT },
      is_marked_for_review: { type: Sequelize.BOOLEAN, defaultValue: false },
      time_spent_seconds: { type: Sequelize.INTEGER, defaultValue: 0 },
      manually_evaluated: { type: Sequelize.BOOLEAN, defaultValue: false },
      evaluator_id: { type: Sequelize.UUID, references: { model: 'users', key: 'id' } },
      evaluator_comment: { type: Sequelize.TEXT },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    await queryInterface.createTable('announcements', {
      id: { type: Sequelize.UUID, primaryKey: true },
      title: { type: Sequelize.STRING, allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: false },
      target_audience: { type: Sequelize.ENUM('all', 'students', 'faculty'), defaultValue: 'all' },
      priority: { type: Sequelize.ENUM('normal', 'important', 'urgent'), defaultValue: 'normal' },
      created_by: { type: Sequelize.UUID, references: { model: 'users', key: 'id' } },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.UUID, primaryKey: true },
      user_id: { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      title: { type: Sequelize.STRING, allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: false },
      type: { type: Sequelize.STRING, allowNull: false },
      is_read: { type: Sequelize.BOOLEAN, defaultValue: false },
      metadata: { type: Sequelize.JSONB },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    await queryInterface.createTable('audit_logs', {
      id: { type: Sequelize.UUID, primaryKey: true },
      user_id: { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      action: { type: Sequelize.STRING, allowNull: false },
      resource_type: { type: Sequelize.STRING },
      resource_id: { type: Sequelize.STRING },
      old_values: { type: Sequelize.JSONB },
      new_values: { type: Sequelize.JSONB },
      ip_address: { type: Sequelize.STRING },
      user_agent: { type: Sequelize.STRING },
      status: { type: Sequelize.ENUM('success', 'failure'), defaultValue: 'success' },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    await queryInterface.createTable('reports', {
      id: { type: Sequelize.UUID, primaryKey: true },
      type: { type: Sequelize.STRING, allowNull: false },
      filters: { type: Sequelize.JSONB },
      generated_by: { type: Sequelize.UUID, references: { model: 'users', key: 'id' } },
      file_path: { type: Sequelize.STRING, allowNull: false },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });
  },
  down: async (queryInterface, Sequelize) => {
    const tables = ['reports', 'audit_logs', 'notifications', 'announcements', 'attempt_answers', 'exam_attempts', 'exam_enrollments', 'exam_questions', 'exams', 'questions', 'otps', 'refresh_tokens', 'user_batches', 'users', 'batches', 'departments'];
    for (const table of tables) {
      await queryInterface.dropTable(table);
    }
  }
};
