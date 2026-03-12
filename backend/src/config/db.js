const { Pool } = require("pg");

console.log("Using DB URL:", process.env.DATABASE_URL);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

module.exports = pool;