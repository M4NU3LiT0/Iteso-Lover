const express = require('express');
const { getConversation, sendMessage, getConversations, markAsRead, deleteMessage } = require('../controllers/message.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes
router.get('/conversations', getConversations);
router.post('/send', sendMessage);
router.get('/:userId', getConversation);
router.put('/:messageId/read', markAsRead);
router.delete('/:messageId', deleteMessage);

module.exports = router;
