require('dotenv').config();
const pool = require('./src/config/db');

async function migrate() {
  try {
    // Preview: show which URNs currently contain whitespace, before touching anything
    const before = await pool.query(`
      SELECT id, urn, batch_id
      FROM students
      WHERE urn ~ '\\s'
    `);

    if (before.rows.length === 0) {
      console.log('No URNs contain whitespace. Nothing to migrate.');
      return;
    }

    console.log(`Found ${before.rows.length} URN(s) with whitespace:`);
    console.table(before.rows);

    // Safety check: make sure stripping whitespace won't create duplicate
    // URNs within the same batch (citext already makes it case-insensitive)
    const dupes = await pool.query(`
      SELECT ARRAY_AGG(urn) AS urns, batch_id, COUNT(*) AS cnt
      FROM students
      GROUP BY REGEXP_REPLACE(urn::text, '\\s+', '', 'g'), batch_id
      HAVING COUNT(*) > 1
    `);

    if (dupes.rows.length > 0) {
      console.error('Aborting migration: stripping whitespace would create duplicate URNs within the same batch:');
      console.table(dupes.rows);
      console.error('Resolve these manually before re-running this migration.');
      return;
    }

    const result = await pool.query(`
      UPDATE students
      SET urn = REGEXP_REPLACE(urn::text, '\\s+', '', 'g')
      WHERE urn ~ '\\s'
    `);

    console.log(`Stripped whitespace from ${result.rowCount} URN(s).`);
  } catch (err) {
    console.error('Failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();