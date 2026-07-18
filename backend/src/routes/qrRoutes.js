const express = require('express');
const router = express.Router();
const {
  generateSession,
  getSessionStatus,
  submitAttendance,
  getSessionReport,
  downloadSessionReport,
} = require('../controllers/qrController');
const { verifyToken } = require('../middleware/auth');

// Admin-only (auth required)
router.post('/batch/:batchId/generate', verifyToken, generateSession);
router.get('/:sessionId/report', verifyToken, getSessionReport);
router.get('/:sessionId/download', verifyToken, downloadSessionReport);
// Public (student-facing scan page — no auth)
router.get('/:token/status', getSessionStatus);
router.post('/:token/submit', submitAttendance);

module.exports = router;