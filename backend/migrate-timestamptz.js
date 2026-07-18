require('dotenv').config();
const pool = require('./src/config/db');

async function migrate() {
  try {
    await pool.query(`ALTER TABLE qr_sessions ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC'`);
    await pool.query(`ALTER TABLE qr_sessions ALTER COLUMN expires_at TYPE timestamptz USING expires_at AT TIME ZONE 'UTC'`);
    await pool.query(`ALTER TABLE attendance ALTER COLUMN marked_at TYPE timestamptz USING marked_at AT TIME ZONE 'UTC'`);
    await pool.query(`ALTER TABLE qr_submissions ALTER COLUMN submitted_at TYPE timestamptz USING submitted_at AT TIME ZONE 'UTC'`);
    console.log('Migrated timestamp columns to timestamptz.');
  } catch (err) {
    console.error('Failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();