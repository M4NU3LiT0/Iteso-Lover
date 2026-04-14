const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required']
    },
    type: {
      type: String,
      enum: ['date_request', 'date_accepted', 'date_rejected', 'date_cancelled', 'message'],
      required: [true, 'Notification type is required']
    },
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    relatedDateRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DateRequest'
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      maxlength: 100
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      maxlength: 500
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: Date,
  },
  {
    timestamps: true
  }
);

// Index for quick queries
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });

// Mark as read method
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);
