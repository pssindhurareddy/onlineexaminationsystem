'use strict';
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Utility to generate UUIDs simply for seeds
const uuid = () => crypto.randomUUID();

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const defaultPassword = await bcrypt.hash('Admin@123', 12);
    
    // Seed Departments
    await queryInterface.bulkInsert('departments', [
      { name: 'Computer Science', code: 'CSE', created_at: new Date(), updated_at: new Date() },
      { name: 'Information Science', code: 'ISE', created_at: new Date(), updated_at: new Date() },
      { name: 'Electronics', code: 'ECE', created_at: new Date(), updated_at: new Date() },
      { name: 'Mechanical', code: 'ME', created_at: new Date(), updated_at: new Date() },
      { name: 'Civil', code: 'CE', created_at: new Date(), updated_at: new Date() }
    ]);
    
    // Admin User
    const adminId = uuid();
    await queryInterface.bulkInsert('users', [{
      id: adminId,
      name: 'System Admin',
      email: 'admin@exampro.com',
      password_hash: defaultPassword,
      role: 'admin',
      created_at: new Date(),
      updated_at: new Date()
    }]);

    // Faculty
    const fac1 = uuid();
    const fac2 = uuid();
    await queryInterface.bulkInsert('users', [
      { id: fac1, name: 'Dr. Anand Sharma', email: 'anand.sharma@exampro.com', department: 'Computer Science', password_hash: defaultPassword, role: 'faculty', created_at: new Date(), updated_at: new Date() },
      { id: fac2, name: 'Dr. Priya Ramesh', email: 'priya.ramesh@exampro.com', department: 'Information Science', password_hash: defaultPassword, role: 'faculty', created_at: new Date(), updated_at: new Date() }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('departments', null, {});
  }
};
