const express = require('express');
const router = express.Router();
const { getBatchReport, getStudentReport } = require('../controllers/reportController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/batch/:batchId', getBatchReport);
router.get('/student/:studentId', getStudentReport);

module.exports = router;