require('dotenv').config();
const pool = require('./src/config/db');

async function check() {
  try {
    const result = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'students'`
    );
    console.log(result.rows);

    const constraints = await pool.query(
      `SELECT conname, pg_get_constraintdef(oid) AS def
       FROM pg_constraint WHERE conrelid = 'students'::regclass`
    );
    console.log(constraints.rows);
  } catch (err) {
    console.error('Failed:', err.message);
  } finally {
    await pool.end();
  }
}

check();