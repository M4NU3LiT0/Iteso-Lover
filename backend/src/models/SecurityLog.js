const mongoose = require('mongoose');

const securityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    event: {
      type: String,
      required: true,
      enum: [
        'login_success',
        'login_failed',
        'login_locked',
        'logout',
        'register',
        'password_reset_requested',
        'password_reset_completed',
        'token_refresh',
        'token_reuse_detected',
        'message_sent',
        'user_blocked',
        'user_reported',
        'profile_photo_uploaded',
        'profile_photo_deleted',
        'unauthorized_access'
      ]
    },
    ip: {
      type: String,
      default: 'unknown'
    },
    userAgent: {
      type: String,
      default: 'unknown'
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info'
    }
  },
  { timestamps: true }
);

// Index for faster queries by user and event
securityLogSchema.index({ userId: 1, createdAt: -1 });
securityLogSchema.index({ event: 1, severity: 1 });

module.exports = mongoose.model('SecurityLog', securityLogSchema);
