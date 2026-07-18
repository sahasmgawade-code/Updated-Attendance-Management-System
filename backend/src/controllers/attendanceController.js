const pool = require('../config/db');

async function canAccessBatch(admin, batchId) {
  if (admin.role === 'super_admin') return true;
  const result = await pool.query(
    'SELECT 1 FROM batch_admins WHERE batch_id = $1 AND admin_id = $2',
    [batchId, admin.id]
  );
  return result.rows.length > 0;
}

// Get attendance for a batch on a specific date (for the Edit Attendance page)
// Students with no record show as 'absent' by default, but no row exists yet.
async function getAttendanceForDate(req, res) {
  const { batchId } = req.params;
  const { date } = req.query; // e.g. ?date=2026-07-15

  if (!date) return res.status(400).json({ error: 'date query param is required (YYYY-MM-DD)' });

  try {
    if (!(await canAccessBatch(req.admin, batchId))) {
      return res.status(403).json({ error: 'No access to this batch' });
    }

    const result = await pool.query(
      `SELECT s.id AS student_id, s.urn, s.first_name, s.last_name,
              COALESCE(a.status, 'absent') AS status,
              a.method
       FROM students s
       LEFT JOIN attendance a
         ON a.student_id = s.id AND a.date = $2
       WHERE s.batch_id = $1
       ORDER BY s.first_name`,
      [batchId, date]
    );

    res.json({ date, students: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

// Bulk save attendance for a batch on a specific date
// Body: { date: '2026-07-15', records: [{ studentId: 1, status: 'present' }, ...] }
async function saveAttendanceForDate(req, res) {
  const { batchId } = req.params;
  const { date, records } = req.body;

  if (!date || !Array.isArray(records)) {
    return res.status(400).json({ error: 'date and records[] are required' });
  }

  try {
    if (!(await canAccessBatch(req.admin, batchId))) {
      return res.status(403).json({ error: 'No access to this batch' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const r of records) {
        if (!['present', 'absent'].includes(r.status)) continue;

        await client.query(
          `INSERT INTO attendance (student_id, batch_id, date, status, method, marked_at)
           VALUES ($1, $2, $3, $4, 'manual', now())
           ON CONFLICT (student_id, date)
           DO UPDATE SET status = $4, method = 'manual', marked_at = now()`,
          [r.studentId, batchId, date, r.status]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.json({ message: 'Attendance saved', date, count: records.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getAttendanceForDate, saveAttendanceForDate };