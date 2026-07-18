require('dotenv').config();
const pool = require('./src/config/db');

async function check() {
  try {
    const tables = ['batches', 'batch_admins'];
    for (const t of tables) {
      const result = await pool.query(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1`,
        [t]
      );
      console.log(`\n${t}:`);
      console.log(result.rows);
    }

    // also check constraints on batch_admins
    const constraints = await pool.query(
      `SELECT conname, pg_get_constraintdef(oid) AS def
       FROM pg_constraint
       WHERE conrelid = 'batch_admins'::regclass`
    );
    console.log('\nbatch_admins constraints:');
    console.log(constraints.rows);
  } catch (err) {
    console.error('Failed:', err.message);
  } finally {
    await pool.end();
  }
}

check();