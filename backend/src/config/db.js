const { Pool, types } = require('pg');
require('dotenv').config();

// Postgres OID 1082 = DATE type. Return as raw 'YYYY-MM-DD' string instead of a JS Date object,
// so no timezone shifting happens on the way out.
types.setTypeParser(1082, (val) => val);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

module.exports = pool;