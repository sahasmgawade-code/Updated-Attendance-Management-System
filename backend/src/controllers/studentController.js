const pool = require('../config/db');

// Helper: check if req.admin can access a given batch
async function canAccessBatch(admin, batchId) {
  if (admin.role === 'super_admin') return true;
  const result = await pool.query(
    'SELECT 1 FROM batch_admins WHERE batch_id = $1 AND admin_id = $2',
    [batchId, admin.id]
  );
  return result.rows.length > 0;
}

// Add a student to a batch
async function addStudent(req, res) {
  const { batchId } = req.params;
  const { urn, firstName, lastName, phone, email, parentPhone } = req.body;

  if (!urn || !firstName || !lastName) {
    return res.status(400).json({ error: 'urn, firstName, and lastName are required' });
  }

  try {
    if (!(await canAccessBatch(req.admin, batchId))) {
      return res.status(403).json({ error: 'No access to this batch' });
    }

    const existing = await pool.query('SELECT id FROM students WHERE urn = $1', [urn]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'URN already exists' });
    }

    const result = await pool.query(
      `INSERT INTO students (batch_id, urn, first_name, last_name, phone, email, parent_phone, is_blacklisted)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false)
       RETURNING *`,
      [batchId, urn, firstName, lastName, phone || null, email || null, parentPhone || null]
    );

    res.status(201).json({ student: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

// List students in a batch
async function listStudents(req, res) {
  const { batchId } = req.params;
  try {
    if (!(await canAccessBatch(req.admin, batchId))) {
      return res.status(403).json({ error: 'No access to this batch' });
    }

    const result = await pool.query(
      'SELECT * FROM students WHERE batch_id = $1 ORDER BY first_name',
      [batchId]
    );
    res.json({ students: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

// Edit a student's details
async function updateStudent(req, res) {
  const { studentId } = req.params;
  const { firstName, lastName, phone, email, parentPhone } = req.body;

  try {
    const studentRes = await pool.query('SELECT batch_id FROM students WHERE id = $1', [studentId]);
    if (studentRes.rows.length === 0) return res.status(404).json({ error: 'Student not found' });

    if (!(await canAccessBatch(req.admin, studentRes.rows[0].batch_id))) {
      return res.status(403).json({ error: 'No access to this batch' });
    }

    const result = await pool.query(
      `UPDATE students SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        phone = COALESCE($3, phone),
        email = COALESCE($4, email),
        parent_phone = COALESCE($5, parent_phone)
       WHERE id = $6
       RETURNING *`,
      [firstName, lastName, phone, email, parentPhone, studentId]
    );

    res.json({ student: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

// Delete a student
async function deleteStudent(req, res) {
  const { studentId } = req.params;
  try {
    const studentRes = await pool.query('SELECT batch_id FROM students WHERE id = $1', [studentId]);
    if (studentRes.rows.length === 0) return res.status(404).json({ error: 'Student not found' });

    if (!(await canAccessBatch(req.admin, studentRes.rows[0].batch_id))) {
      return res.status(403).json({ error: 'No access to this batch' });
    }

    await pool.query('DELETE FROM students WHERE id = $1', [studentId]);
    res.json({ message: 'Student deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

// Blacklist / unblacklist a student (super_admin and admins with access to the student's batch)
async function setBlacklist(req, res) {
  const { studentId } = req.params;
  const { blacklisted } = req.body; // true/false

  if (typeof blacklisted !== 'boolean') {
    return res.status(400).json({ error: 'blacklisted (boolean) is required' });
  }

  try {
    const studentRes = await pool.query('SELECT batch_id FROM students WHERE id = $1', [studentId]);
    if (studentRes.rows.length === 0) return res.status(404).json({ error: 'Student not found' });

    if (!(await canAccessBatch(req.admin, studentRes.rows[0].batch_id))) {
      return res.status(403).json({ error: 'No access to this batch' });
    }

    const result = await pool.query(
      'UPDATE students SET is_blacklisted = $1 WHERE id = $2 RETURNING *',
      [blacklisted, studentId]
    );

    res.json({ student: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { addStudent, listStudents, updateStudent, deleteStudent, setBlacklist };