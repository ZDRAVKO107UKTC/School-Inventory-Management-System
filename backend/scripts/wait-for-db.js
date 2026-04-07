const path = require('path');
const { Client } = require('pg');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const maxAttempts = Number.parseInt(process.env.DB_WAIT_MAX_ATTEMPTS || '30', 10);
const delayMs = Number.parseInt(process.env.DB_WAIT_DELAY_MS || '2000', 10);

const connectionConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'school_inventory',
    };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const main = async () => {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const client = new Client(connectionConfig);

    try {
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      console.log(`[wait-for-db] database is ready after ${attempt} attempt(s)`);
      return;
    } catch (error) {
      try {
        await client.end();
      } catch (_endError) {
        // Ignore cleanup errors while retrying.
      }

      if (attempt === maxAttempts) {
        console.error(`[wait-for-db] database did not become ready: ${error.message}`);
        process.exit(1);
      }

      console.log(`[wait-for-db] database not ready yet (${attempt}/${maxAttempts}): ${error.message}`);
      await sleep(delayMs);
    }
  }
};

main().catch((error) => {
  console.error(`[wait-for-db] failed: ${error.message}`);
  process.exit(1);
});
