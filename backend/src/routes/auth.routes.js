const express = require('express');
const { register, login, logout } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);

module.exports = router;
