const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  // Force IPv4 to avoid Render/Supabase IPv6 connectivity issues
  family: 4,
});

pool.on('error', (err) => console.error('Unexpected DB error', err));

module.exports = pool;
