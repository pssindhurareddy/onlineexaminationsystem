require('dotenv').config({ path: '../.env' });
const { sequelize } = require('../src/config/database');
const { Organization, User, Department, Batch } = require('../src/models');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const uuid = () => crypto.randomUUID();

const syncAndSeed = async () => {
  try {
    console.log('[DB] Connecting and syncing schema (SaaS Mode)...');
    await sequelize.sync({ force: true });
    console.log('[DB] Schema recreated.');

    const adminPassword = await bcrypt.hash('Admin@123', 12);
    const facultyPassword = await bcrypt.hash('Faculty@123', 12);
    const studentPassword = await bcrypt.hash('Student@123', 12);

    // 1. Create Organizations
    console.log('[DB] Seeding Organizations...');
    const stanford = await Organization.create({
      id: uuid(),
      name: 'Stanford Academy',
      slug: 'stanford',
      theme_color: '#8C1515'
    });

    const mit = await Organization.create({
      id: uuid(),
      name: 'MIT Institute',
      slug: 'mit',
      theme_color: '#A31F34'
    });

    // 2. Seed Stanford Data
    console.log('[DB] Seeding Stanford Data...');
    const stanfordCS = await Department.create({
      organization_id: stanford.id,
      name: 'Computer Science',
      code: 'CS'
    });

    const stanfordSectionA = await Batch.create({
      organization_id: stanford.id,
      department_id: stanfordCS.id,
      name: 'Section A',
      year: 2024
    });

    await User.create({
      id: uuid(),
      organization_id: stanford.id,
      name: 'Stanford Admin',
      email: 'admin@stanford.edu',
      password_hash: adminPassword,
      role: 'admin'
    });

    await User.create({
      id: uuid(),
      organization_id: stanford.id,
      name: 'Prof. Andrew Ng',
      email: 'andrew@stanford.edu',
      password_hash: facultyPassword,
      role: 'faculty'
    });

    await User.create({
      id: uuid(),
      organization_id: stanford.id,
      name: 'Stanford Student',
      email: 'student@stanford.edu',
      password_hash: studentPassword,
      role: 'student'
    });

    // 3. Seed MIT Data
    console.log('[DB] Seeding MIT Data...');
    const mitEE = await Department.create({
      organization_id: mit.id,
      name: 'Electrical Engineering',
      code: 'EE'
    });

    const mitSection1 = await Batch.create({
      organization_id: mit.id,
      department_id: mitEE.id,
      name: 'Section 1',
      year: 2024
    });

    await User.create({
      id: uuid(),
      organization_id: mit.id,
      name: 'MIT Admin',
      email: 'admin@mit.edu',
      password_hash: adminPassword,
      role: 'admin'
    });

    await User.create({
      id: uuid(),
      organization_id: mit.id,
      name: 'MIT Student',
      email: 'student@mit.edu',
      password_hash: studentPassword,
      role: 'student'
    });

    console.log('[DB] Multi-Tenant Seeding Complete!');
    process.exit(0);
  } catch (error) {
    console.error('[DB] Sync & Seed Failed:', error);
    process.exit(1);
  }
};

syncAndSeed();
