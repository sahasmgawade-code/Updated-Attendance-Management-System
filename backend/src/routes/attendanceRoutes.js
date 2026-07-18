const express = require('express');
const router = express.Router();
const { getAttendanceForDate, saveAttendanceForDate } = require('../controllers/attendanceController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/batch/:batchId', getAttendanceForDate);
router.post('/batch/:batchId', saveAttendanceForDate);

module.exports = router;