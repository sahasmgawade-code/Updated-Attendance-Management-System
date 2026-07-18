const express = require('express');
const router = express.Router();
const { createAdmin, deleteAdmin, listAdmins, listAdminsBasic } = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Any authenticated admin can call this — used for the batch-collaborator picker
router.get('/basic', verifyToken, listAdminsBasic);

// Everything below requires super_admin
router.use(verifyToken, requireRole('super_admin'));

router.post('/', createAdmin);
router.delete('/:id', deleteAdmin);
router.get('/', listAdmins);

module.exports = router;