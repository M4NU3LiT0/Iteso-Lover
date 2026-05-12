const express = require('express');
const {
  listUsers,
  verifyUser,
  unverifyUser,
  deactivateUser,
  activateUser,
  getSecurityLogs,
  getReports,
  getStats
} = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireAdmin');

const router = express.Router();

router.use(protect);
router.use(requireAdmin);

router.get('/stats', getStats);
router.get('/users', listUsers);
router.put('/users/:id/verify', verifyUser);
router.put('/users/:id/unverify', unverifyUser);
router.put('/users/:id/deactivate', deactivateUser);
router.put('/users/:id/activate', activateUser);
router.get('/security-logs', getSecurityLogs);
router.get('/reports', getReports);

module.exports = router;
