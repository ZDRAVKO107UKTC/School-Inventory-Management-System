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

const parseBoolean = (value, fallback = false) => {
  if (typeof value !== 'string') {
    return fallback;
  }

  switch (value.trim().toLowerCase()) {
    case 'true':
    case '1':
    case 'yes':
    case 'on':
      return true;
    case 'false':
    case '0':
    case 'no':
    case 'off':
      return false;
    default:
      return fallback;
  }
};

const buildDirectDatabaseConfig = (databaseName) => ({
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
  database: databaseName,
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5433,
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

const shouldUseDatabaseUrlInProduction = Boolean(process.env.DATABASE_URL);
const sslEnabled = parseBoolean(process.env.DB_SSL, false);
const rejectUnauthorized = parseBoolean(process.env.DB_SSL_REJECT_UNAUTHORIZED, false);

const productionConfig = shouldUseDatabaseUrlInProduction
  ? {
      use_env_variable: 'DATABASE_URL',
      dialect: 'postgres',
      dialectOptions: sslEnabled
        ? {
            ssl: {
              require: true,
              rejectUnauthorized,
            },
          }
        : {},
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    }
  : buildDirectDatabaseConfig(process.env.DB_NAME || 'school_inventory');

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
    ...productionConfig,
  },
};
