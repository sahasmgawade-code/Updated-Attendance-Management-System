require('dotenv').config();
const pool = require('./src/config/db');

async function check() {
  try {
    for (const t of ['qr_sessions', 'attendance', 'qr_submissions']) {
      const cols = await pool.query(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1`,
        [t]
      );
      console.log(`\n${t} columns:`);
      console.log(cols.rows);

      const cons = await pool.query(
        `SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conrelid = $1::regclass`,
        [t]
      );
      console.log(`${t} constraints:`);
      console.log(cons.rows);
    }
  } catch (err) {
    console.error('Failed:', err.message);
  } finally {
    await pool.end();
  }
}

check();