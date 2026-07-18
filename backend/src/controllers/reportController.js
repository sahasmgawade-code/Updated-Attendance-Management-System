const pool = require('../config/db');

async function canAccessBatch(admin, batchId) {
  if (admin.role === 'super_admin') return true;
  const result = await pool.query(
    'SELECT 1 FROM batch_admins WHERE batch_id = $1 AND admin_id = $2',
    [batchId, admin.id]
  );
  return result.rows.length > 0;
}

// Batch report: per-student stats + defaulter split (< 75%) vs good standing (>= 75%)
// Optional ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD restricts the calculation to that
// window. Omit both for the all-time report.
async function getBatchReport(req, res) {
  const { batchId } = req.params;
  const { startDate, endDate } = req.query;

  try {
    if (!(await canAccessBatch(req.admin, batchId))) {
      return res.status(403).json({ error: 'No access to this batch' });
    }

    const params = [batchId];
    let dateFilter = '';
    if (startDate) {
      params.push(startDate);
      dateFilter += ` AND date >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      dateFilter += ` AND date <= $${params.length}`;
    }

    const workingDaysRes = await pool.query(
      `SELECT COUNT(DISTINCT date) AS total FROM attendance WHERE batch_id = $1${dateFilter}`,
      params
    );
    const totalWorkingDays = parseInt(workingDaysRes.rows[0].total, 10) || 0;

    const studentsRes = await pool.query(
      `SELECT s.id, s.urn, s.first_name, s.last_name,
              COUNT(a.id) FILTER (WHERE a.status = 'present') AS present_count
       FROM students s
       LEFT JOIN attendance a
         ON a.student_id = s.id AND a.batch_id = $1${dateFilter}
       WHERE s.batch_id = $1
       GROUP BY s.id
       ORDER BY s.first_name`,
      params
    );

    const allStudents = studentsRes.rows.map(s => {
      const presentCount = parseInt(s.present_count, 10) || 0;
      const percentage = totalWorkingDays > 0
        ? Math.round((presentCount / totalWorkingDays) * 10000) / 100
        : 0;
      return {
        studentId: s.id,
        urn: s.urn,
        firstName: s.first_name,
        lastName: s.last_name,
        presentCount,
        totalWorkingDays,
        percentage,
      };
    });

    const defaulters = allStudents.filter(s => s.percentage < 75);
    const goodStanding = allStudents.filter(s => s.percentage >= 75);

    res.json({
      batchId: parseInt(batchId, 10),
      totalWorkingDays,
      startDate: startDate || null,
      endDate: endDate || null,
      defaulters,
      goodStanding,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

// Individual student report: full attendance history + summary
async function getStudentReport(req, res) {
  const { studentId } = req.params;

  try {
    const studentRes = await pool.query('SELECT * FROM students WHERE id = $1', [studentId]);
    if (studentRes.rows.length === 0) return res.status(404).json({ error: 'Student not found' });

    const student = studentRes.rows[0];

    if (!(await canAccessBatch(req.admin, student.batch_id))) {
      return res.status(403).json({ error: 'No access to this batch' });
    }

    const workingDaysRes = await pool.query(
      'SELECT COUNT(DISTINCT date) AS total FROM attendance WHERE batch_id = $1',
      [student.batch_id]
    );
    const totalWorkingDays = parseInt(workingDaysRes.rows[0].total, 10) || 0;

    const historyRes = await pool.query(
      `SELECT date, status, method, marked_at
       FROM attendance
       WHERE student_id = $1 AND batch_id = $2
       ORDER BY date DESC`,
      [studentId, student.batch_id]
    );

    const presentCount = historyRes.rows.filter(r => r.status === 'present').length;
    const percentage = totalWorkingDays > 0
      ? Math.round((presentCount / totalWorkingDays) * 10000) / 100
      : 0;

    res.json({
      student: {
        id: student.id,
        urn: student.urn,
        firstName: student.first_name,
        lastName: student.last_name,
        phone: student.phone,
        email: student.email,
        parentPhone: student.parent_phone,
        isBlacklisted: student.is_blacklisted,
      },
      totalWorkingDays,
      presentCount,
      percentage,
      history: historyRes.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getBatchReport, getStudentReport };