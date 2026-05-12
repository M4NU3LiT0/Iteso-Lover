const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required']
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver is required']
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      maxlength: [1000, 'Message must not exceed 1000 characters']
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: Date,
    // Optional: media attachments
    attachments: [
      {
        url: String,
        type: String, // 'image', 'file', etc.
        size: Number
      }
    ]
  },
  {
    timestamps: true
  }
);

// Index for quick conversation queries
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, isRead: 1 });

module.exports = mongoose.model('Message', messageSchema);
