/**
 * Environment Variable Validation
 * Ensures all required env vars are present at startup.
 */

const validateEnvironment = () => {
  const required = ['JWT_SECRET', 'NODE_ENV'];
  const databaseVariableGroup = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];

  const optional = [
    'SERVICE_PORT',
    'JWT_EXPIRY',
    'LOG_DB_QUERIES',
    'ALLOWED_ORIGINS',
    'GOOGLE_SERVICE_ACCOUNT_JSON',
    'FRONTEND_URL',
    'COOKIE_SECURE',
    'COOKIE_SAME_SITE',
    'DB_SSL',
    'DB_SSL_REJECT_UNAUTHORIZED',
  ];

  const missing = required.filter((key) => !process.env[key]);
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
  const missingDatabaseVars = databaseVariableGroup.filter((key) => !process.env[key]);

  if (!hasDatabaseUrl && missingDatabaseVars.length > 0) {
    missing.push(`DATABASE_URL or ${missingDatabaseVars.join(', ')}`);
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file or system environment'
    );
  }

  if (!['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
    throw new Error(
      `Invalid NODE_ENV: ${process.env.NODE_ENV}. Must be one of: development, production, test`
    );
  }

  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('postgres')) {
    console.warn('DATABASE_URL does not contain "postgres" - confirm the connection string');
  }

  console.log(
    'Environment validation passed\n' +
    `   NODE_ENV: ${process.env.NODE_ENV}\n` +
    `   Database: ${hasDatabaseUrl ? 'DATABASE_URL' : 'DB_* variables'}\n` +
    `   Loaded: ${required.length} required, ${optional.filter((key) => process.env[key]).length} optional variables`
  );
};

module.exports = { validateEnvironment };
