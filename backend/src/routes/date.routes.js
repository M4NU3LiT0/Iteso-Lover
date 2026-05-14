const express = require('express');
const {
  createDateRequest,
  getPendingRequests,
  acceptDateRequest,
  rejectDateRequest,
  getScheduledDates,
  cancelDate
} = require('../controllers/date.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes
router.post('/request', createDateRequest);
router.get('/requests', getPendingRequests);
router.get('/scheduled', getScheduledDates);
router.put('/request/:id/accept', acceptDateRequest);
router.put('/request/:id/reject', rejectDateRequest);
router.put('/request/:id/cancel', cancelDate);

module.exports = router;
