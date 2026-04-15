process.env.NODE_ENV = 'development';
require('dotenv').config({ path: '../.env' });
const { sequelize, User } = require('../src/models');

const sync = async () => {
    try {
        console.log('Altering User table to add subjects...');
        await User.sync({ alter: true });
        console.log('✅ Alteration complete.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Alter failed:', err);
        process.exit(1);
    }
};

sync();
