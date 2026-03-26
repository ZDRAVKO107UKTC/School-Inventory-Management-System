/**
 * Environment Variable Validation
 * Ensures all required env vars are present at startup
 */

const validateEnvironment = () => {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NODE_ENV',
  ];

  const optional = [
    'SERVICE_PORT',
    'JWT_EXPIRY',
    'LOG_DB_QUERIES',
    'ALLOWED_ORIGINS',
    'GOOGLE_SERVICE_ACCOUNT_JSON',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please check your .env file or system environment`
    );
  }

  // Validate specific formats
  if (!['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
    throw new Error(
      `Invalid NODE_ENV: ${process.env.NODE_ENV}. ` +
      `Must be one of: development, production, test`
    );
  }

  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('postgres')) {
    console.warn('⚠️  DATABASE_URL does not contain "postgres" - confirm connection string');
  }

  console.log(
    `✅ Environment validation passed\n` +
    `   NODE_ENV: ${process.env.NODE_ENV}\n` +
    `   Loaded: ${required.length} required, ${optional.filter(k => process.env[k]).length} optional variables`
  );
};

module.exports = { validateEnvironment };
