require('dotenv').config();
const pool = require('./src/config/db');

async function migrate() {
  try {
    // Safety check first: make sure no two students in the same batch
    // would collide once URN comparison becomes case-insensitive.
    const dupes = await pool.query(`
      SELECT ARRAY_AGG(urn) AS urns, batch_id, COUNT(*) AS cnt
      FROM students
      GROUP BY UPPER(urn), batch_id
      HAVING COUNT(*) > 1
    `);
    if (dupes.rows.length > 0) {
      console.error('Aborting migration: found case-insensitive duplicate URNs within the same batch:');
      console.table(dupes.rows);
      console.error('Resolve these manually (delete/merge/rename) before re-running this migration.');
      return;
    }

    // Enable the citext extension (case-insensitive text type)
    await pool.query(`CREATE EXTENSION IF NOT EXISTS citext`);

    // Convert the urn column to citext
    await pool.query(`ALTER TABLE students ALTER COLUMN urn TYPE citext`);

    // Normalize existing values to uppercase for consistency going forward
    await pool.query(`UPDATE students SET urn = UPPER(urn)`);

    console.log('Migrated students.urn to citext and normalized existing values to uppercase.');
  } catch (err) {
    console.error('Failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();