require('dotenv').config();
const pool = require('./src/config/db');

async function check() {
  try {
    const result = await pool.query('SELECT id, name, email, role FROM admins');
    console.log(result.rows);
  } catch (err) {
    console.error('Failed:', err.message);
  } finally {
    await pool.end();
  }
}

check();