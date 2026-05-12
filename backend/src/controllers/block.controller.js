const User = require('../models/User');
const { logSecurityEvent } = require('../utils/auditLogger');

// POST /api/users/:id/block
exports.blockUser = async (req, res) => {
  try {
    const targetId = req.params.id;
    const currentUserId = req.user.id;

    if (targetId === currentUserId) {
      return res.status(400).json({ success: false, message: 'Cannot block yourself' });
    }

    const target = await User.findById(targetId);
    if (!target) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { blockedUsers: targetId }
    });

    await logSecurityEvent('user_blocked', req, { blockedUserId: targetId }, 'info');

    return res.status(200).json({ success: true, message: 'User blocked successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error blocking user' });
  }
};

// DELETE /api/users/:id/block
exports.unblockUser = async (req, res) => {
  try {
    const targetId = req.params.id;
    const currentUserId = req.user.id;

    await User.findByIdAndUpdate(currentUserId, {
      $pull: { blockedUsers: targetId }
    });

    return res.status(200).json({ success: true, message: 'User unblocked successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error unblocking user' });
  }
};

// POST /api/users/:id/report
exports.reportUser = async (req, res) => {
  try {
    const targetId = req.params.id;
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'A reason is required to report a user' });
    }

    const target = await User.findById(targetId);
    if (!target) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await logSecurityEvent('user_reported', req, {
      reportedUserId: targetId,
      reportedBy: req.user.id,
      reason: reason.trim().slice(0, 500)
    }, 'warning');

    return res.status(200).json({ success: true, message: 'Report submitted. Our team will review it.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error submitting report' });
  }
};
