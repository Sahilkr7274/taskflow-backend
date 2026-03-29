const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  family: 4,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => console.error('Unexpected DB error', err));

module.exports = pool;
