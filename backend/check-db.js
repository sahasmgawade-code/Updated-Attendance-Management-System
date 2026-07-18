require('dotenv').config();
const pool = require('./src/config/db');

async function check() {
  try {
    const result = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
    );
    console.log(result.rows.map(r => r.table_name));
  } catch (err) {
    console.error('Failed:', err.message);
  } finally {
    await pool.end();
  }
}

check();