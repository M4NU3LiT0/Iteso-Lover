const express = require('express');
const { getProfile, updateProfile, searchUsers, getUserById, getCompatibleUsers } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/compatible', getCompatibleUsers);
router.get('/search', searchUsers);
router.get('/:id', getUserById);

module.exports = router;
