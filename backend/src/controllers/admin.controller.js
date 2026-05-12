const User = require('../models/User');
const SecurityLog = require('../models/SecurityLog');

// GET /api/admin/users
exports.listUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = search
      ? {
          $or: [
            { firstName: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
            { email: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }
          ]
        }
      : {};

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('firstName lastName email role isActive isVerified createdAt lastLogin loginAttempts lockUntil')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter)
    ]);

    return res.status(200).json({ success: true, users, total, page: Number(page) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching users' });
  }
};

// PUT /api/admin/users/:id/verify
exports.verifyUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    ).select('firstName lastName email isVerified');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    return res.status(200).json({ success: true, message: 'User verified', user });
  } catch {
    return res.status(500).json({ success: false, message: 'Error verifying user' });
  }
};

// PUT /api/admin/users/:id/unverify
exports.unverifyUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: false },
      { new: true }
    ).select('firstName lastName email isVerified');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    return res.status(200).json({ success: true, message: 'Verification removed', user });
  } catch {
    return res.status(500).json({ success: false, message: 'Error updating user' });
  }
};

// PUT /api/admin/users/:id/deactivate
exports.deactivateUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate your own account' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true })
      .select('firstName lastName email isActive');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    return res.status(200).json({ success: true, message: 'User deactivated', user });
  } catch {
    return res.status(500).json({ success: false, message: 'Error deactivating user' });
  }
};

// PUT /api/admin/users/:id/activate
exports.activateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true })
      .select('firstName lastName email isActive');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    return res.status(200).json({ success: true, message: 'User activated', user });
  } catch {
    return res.status(500).json({ success: false, message: 'Error activating user' });
  }
};

// GET /api/admin/security-logs
exports.getSecurityLogs = async (req, res) => {
  try {
    const { severity, event, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = {};
    if (severity) filter.severity = severity;
    if (event) filter.event = event;

    const [logs, total] = await Promise.all([
      SecurityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'firstName lastName email'),
      SecurityLog.countDocuments(filter)
    ]);

    return res.status(200).json({ success: true, logs, total, page: Number(page) });
  } catch {
    return res.status(500).json({ success: false, message: 'Error fetching logs' });
  }
};

// GET /api/admin/reports — user reports from security logs
exports.getReports = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { event: 'user_reported' };
    const [reports, total] = await Promise.all([
      SecurityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'firstName lastName email'),
      SecurityLog.countDocuments(filter)
    ]);

    return res.status(200).json({ success: true, reports, total, page: Number(page) });
  } catch {
    return res.status(500).json({ success: false, message: 'Error fetching reports' });
  }
};

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const [totalUsers, activeUsers, verifiedUsers, lockedUsers, criticalLogs] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ lockUntil: { $gt: Date.now() } }),
      SecurityLog.countDocuments({ severity: 'critical' })
    ]);

    return res.status(200).json({
      success: true,
      stats: { totalUsers, activeUsers, verifiedUsers, lockedUsers, criticalLogs }
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Error fetching stats' });
  }
};
