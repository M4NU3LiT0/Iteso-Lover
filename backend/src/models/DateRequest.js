const mongoose = require('mongoose');

const dateRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requester is required']
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver is required']
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending'
    },
    // Date details
    preferredDate: {
      type: Date,
      required: [true, 'Preferred date is required']
    },
    preferredTime: {
      type: String,
      required: [true, 'Preferred time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide valid time (HH:MM)']
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      enum: ['Library', 'Cafeteria', 'Sports Complex', 'Plaza Mayor', 'Other'],
    },
    customLocation: {
      type: String,
      maxlength: 200
    },
    message: {
      type: String,
      maxlength: 500,
      default: ''
    },
    // Responses
    responseDate: Date,
    responseMessage: String,
    // Meeting Status
    wasMeetingCompleted: {
      type: Boolean,
      default: null
    },
  },
  {
    timestamps: true
  }
);

// Index for quick queries
dateRequestSchema.index({ requester: 1, receiver: 1 });
dateRequestSchema.index({ receiver: 1, status: 1 });

module.exports = mongoose.model('DateRequest', dateRequestSchema);
