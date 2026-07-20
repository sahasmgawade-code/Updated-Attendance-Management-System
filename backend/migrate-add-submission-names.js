require('dotenv').config();
const pool = require('./src/config/db');

async function migrate() {
  try {
    await pool.query(`ALTER TABLE qr_submissions ADD COLUMN IF NOT EXISTS submitted_first_name VARCHAR(100)`);
    await pool.query(`ALTER TABLE qr_submissions ADD COLUMN IF NOT EXISTS submitted_last_name VARCHAR(100)`);
    console.log('Migrated.');
  } catch (err) {
    console.error('Failed:', err.message);
  } finally {
    await pool.end();
  }
}
migrate();