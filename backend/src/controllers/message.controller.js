const xss = require('xss');
const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');
const { logSecurityEvent } = require('../utils/auditLogger');

// Sanitize message content — strips HTML/JS while preserving plain text
const sanitizeContent = (raw) => xss(raw, { whiteList: {}, stripIgnoreTag: true });

// GET /api/messages/:userId — conversation between current user and :userId
exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const { limit = 50, skip = 0 } = req.query;

    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(Number.parseInt(limit, 10))
      .skip(Number.parseInt(skip, 10))
      .populate('sender', 'firstName lastName profilePhoto')
      .populate('receiver', 'firstName lastName profilePhoto');

    // Mark messages sent by the other user as read
    await Message.updateMany(
      { sender: userId, receiver: currentUserId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return res.status(200).json({ success: true, messages: messages.reverse() });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching conversation' });
  }
};

// POST /api/messages/send
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !content) {
      return res.status(400).json({ success: false, message: 'Receiver ID and content are required' });
    }

    if (typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ success: false, message: 'Message exceeds 1000 characters' });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ success: false, message: 'Receiver not found' });
    }

    // Sanitize before persisting to prevent stored XSS
    const cleanContent = sanitizeContent(content);

    const message = await Message.create({ sender: senderId, receiver: receiverId, content: cleanContent });
    await message.populate('sender', 'firstName lastName profilePhoto');
    await message.populate('receiver', 'firstName lastName profilePhoto');

    await logSecurityEvent('message_sent', req, { senderId, receiverId }, 'info');

    return res.status(201).json({ success: true, message, data: message });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error sending message' });
  }
};

// GET /api/messages/conversations
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentUserObjectId = new mongoose.Types.ObjectId(userId);

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: currentUserObjectId }, { receiver: currentUserObjectId }]
        }
      },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ['$sender', currentUserObjectId] }, '$receiver', '$sender']
          },
          lastMessage: { $last: '$content' },
          lastMessageTime: { $last: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiver', currentUserObjectId] }, { $eq: ['$isRead', false] }] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { lastMessageTime: -1 } }
    ]);

    const populated = await User.populate(conversations, { path: '_id' });
    return res.status(200).json({ success: true, conversations: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching conversations' });
  }
};

// PUT /api/messages/:messageId/read
exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Only the intended recipient can mark a message as read
    if (message.receiver.toString() !== userId) {
      await logSecurityEvent('unauthorized_access', req, { action: 'markAsRead', messageId }, 'warning');
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updated = await Message.findByIdAndUpdate(
      messageId,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    return res.status(200).json({ success: true, message: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error marking message as read' });
  }
};

// DELETE /api/messages/:messageId
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.sender.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this message' });
    }

    await Message.findByIdAndDelete(messageId);
    return res.status(200).json({ success: true, message: 'Message deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error deleting message' });
  }
};
