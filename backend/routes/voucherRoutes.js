const express = require('express');
const router = express.Router();
const {
  createVoucher,
  getVouchers,
  getVoucher,
  updateVoucher,
  submitVoucher,
  approveVoucher,
  rejectVoucher,
  payVoucher,
  deleteVoucher,
  getAnalytics,
} = require('../controllers/voucherController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.get('/analytics', getAnalytics);
router.get('/', getVouchers);
router.post('/', upload.single('receipt'), createVoucher);
router.get('/:id', getVoucher);
router.put('/:id', upload.single('receipt'), updateVoucher);
router.delete('/:id', deleteVoucher);

router.put('/:id/submit', submitVoucher);
router.put('/:id/approve', authorize('Manager', 'Admin', 'Finance'), approveVoucher);
router.put('/:id/reject', authorize('Manager', 'Admin', 'Finance'), rejectVoucher);
router.put('/:id/pay', authorize('Finance', 'Admin'), payVoucher);

module.exports = router;
