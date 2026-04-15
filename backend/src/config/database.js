const { Sequelize } = require('sequelize');

const sequelize = process.env.DATABASE_URL 
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        },
        family: 4
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 60000,
        idle: 10000
      }
    })
  : new Sequelize(
      process.env.DB_NAME || 'examdb',
      process.env.DB_USER || 'examuser',
      process.env.DB_PASSWORD || 'strongpassword123',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
          family: 4
        },
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('[DB] PostgreSQL connected successfully');
  } catch (error) {
    console.error('[DB] PostgreSQL connection failed:', error);
  }
};

module.exports = { sequelize, connectDB };
