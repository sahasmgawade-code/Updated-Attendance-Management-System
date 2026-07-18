const express = require('express');
const router = express.Router();
const { login, changePassword } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/login', login);
router.post('/change-password', verifyToken, changePassword);

module.exports = router;