const path = require('path');
const { spawnSync } = require('child_process');
const { Client } = require('pg');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const run = (command, args, cwd) => {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
};

const main = async () => {
  const client = new Client({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'school_inventory'
  });

  try {
    await client.connect();
    const tableCheck = await client.query(
      "SELECT to_regclass('public.users') AS table_name"
    );

    if (!tableCheck.rows[0].table_name) {
      console.log('[seed-if-empty] users table missing, skipping seed check.');
      return;
    }

    const countResult = await client.query('SELECT COUNT(*)::int AS count FROM users');
    const userCount = countResult.rows[0].count;

    if (userCount > 0) {
      console.log(`[seed-if-empty] users table already has ${userCount} rows, skipping seed.`);
      return;
    }

    console.log('[seed-if-empty] database is empty, running seeders...');
    run('npm', ['run', 'db:seed'], path.join(__dirname, '..'));
  } finally {
    await client.end().catch(() => {});
  }
};

main().catch((error) => {
  console.error('[seed-if-empty] failed:', error.message);
  process.exit(1);
});

