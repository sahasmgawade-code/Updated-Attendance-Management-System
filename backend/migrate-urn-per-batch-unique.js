require('dotenv').config();
const pool = require('./src/config/db');

async function migrate() {
  try {
    // Find the existing single-column unique constraint on urn (if it still exists)
    const constraintRes = await pool.query(`
      SELECT con.conname
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      WHERE rel.relname = 'students'
        AND con.contype = 'u'
        AND array_length(con.conkey, 1) = 1
        AND con.conkey[1] = (
          SELECT attnum FROM pg_attribute
          WHERE attrelid = rel.oid AND attname = 'urn'
        )
    `);

    if (constraintRes.rows.length > 0) {
      const constraintName = constraintRes.rows[0].conname;
      await pool.query(`ALTER TABLE students DROP CONSTRAINT "${constraintName}"`);
      console.log(`Dropped old unique constraint: ${constraintName}`);
    } else {
      console.log('No single-column unique constraint found on urn (already migrated?).');
    }

    // Add composite unique constraint: urn unique per batch, not globally
    const existingComposite = await pool.query(`
      SELECT 1 FROM pg_constraint WHERE conname = 'students_urn_batch_id_key'
    `);
    if (existingComposite.rows.length === 0) {
      await pool.query(`
        ALTER TABLE students
        ADD CONSTRAINT students_urn_batch_id_key UNIQUE (urn, batch_id)
      `);
      console.log('Added composite unique constraint on (urn, batch_id).');
    } else {
      console.log('Composite unique constraint already exists.');
    }

    console.log('Migration complete. Students can now belong to multiple batches.');
  } catch (err) {
    console.error('Failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();