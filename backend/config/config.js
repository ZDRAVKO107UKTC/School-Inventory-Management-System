require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

/**
 * Sequelize Configuration
 * Environment-specific database settings
 */

// Determine logging behavior
const enableDbLogging = 
  process.env.NODE_ENV === 'development' &&
  process.env.LOG_DB_QUERIES === 'true';

const loggingConfig = enableDbLogging
  ? (sql, timing) => console.log(`[SQL] (${timing}ms) ${sql}`)
  : false;

module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres123',
    database: process.env.DB_NAME || 'school_inventory',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5433,
    dialect: 'postgres',
    logging: loggingConfig,
    benchmark: true,
  },

  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres123',
    database: process.env.DB_NAME_TEST || 'school_inventory_test',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5433,
    dialect: 'postgres',
    logging: false,
  },

  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: false,
    pool: {
      max: 5,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
  },
};
