const SecurityLog = require('../models/SecurityLog');

// Log a security event without throwing if logging fails
const logSecurityEvent = async (event, req, details = {}, severity = 'info') => {
  try {
    await SecurityLog.create({
      userId: req.user?._id || null,
      event,
      ip: req.ip || req.connection?.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      details,
      severity
    });
  } catch (err) {
    // Logging must never crash the app
    console.error('Audit log error:', err.message);
  }
};

module.exports = { logSecurityEvent };
