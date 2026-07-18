const express = require('express');
const router = express.Router();
const {
  createBatch,
  deleteBatch,
  listBatches,
  assignAdminToBatch,
} = require('../controllers/batchController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken); // all batch routes require login

router.get('/', listBatches);
router.post('/', createBatch);
router.delete('/:id', deleteBatch);
router.post('/:id/assign-admin', requireRole('super_admin'), assignAdminToBatch);

module.exports = router;