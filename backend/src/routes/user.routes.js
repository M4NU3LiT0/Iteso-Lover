const express = require('express');
const { getProfile, updateProfile, searchUsers, getUserById } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/search', searchUsers);
router.get('/:id', getUserById);

module.exports = router;
