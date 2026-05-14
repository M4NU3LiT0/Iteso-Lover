const DateRequest = require('../models/DateRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { validateDateTime } = require('../utils/validators');

// @desc    Create a date request
// @route   POST /api/dates/request
// @access  Private
exports.createDateRequest = async (req, res, next) => {
  try {
    const { receiverId, preferredDate, preferredTime, location, customLocation, message } = req.body;

    // Validation
    if (!receiverId || !preferredDate || !preferredTime || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Validate date and time
    const validation = validateDateTime(preferredDate, preferredTime);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if trying to request date with self
    if (receiverId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot request a date with yourself'
      });
    }

    // Validate time is within allowed range (08:00 - 22:00)
    const [hours] = preferredTime.split(':').map(Number);
    if (hours < 8 || hours >= 22) {
      return res.status(400).json({
        success: false,
        message: 'La hora debe estar entre las 8:00 y las 22:00'
      });
    }

    // Anti-spam: max 5 pending outgoing requests
    const pendingCount = await DateRequest.countDocuments({
      requester: req.user._id,
      status: 'pending'
    });
    if (pendingCount >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Tienes demasiadas solicitudes pendientes (máximo 5). Espera respuesta antes de enviar más.'
      });
    }

    // Create date request
    const dateRequest = new DateRequest({
      requester: req.user._id,
      receiver: receiverId,
      preferredDate,
      preferredTime,
      location,
      customLocation,
      message
    });

    await dateRequest.save();
    await dateRequest.populate('requester', 'firstName lastName profilePhoto');

    // Create notification for receiver
    const notification = new Notification({
      user: receiverId,
      type: 'date_request',
      relatedUser: req.user._id,
      relatedDateRequest: dateRequest._id,
      title: `Date request from ${req.user.firstName}`,
      message: `${req.user.firstName} requested a date with you`
    });
    await notification.save();

    res.status(201).json({
      success: true,
      message: 'Date request sent successfully',
      dateRequest
    });
  } catch (error) {
    console.error('Create date request error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error creating date request'
    });
  }
};

// @desc    Get pending date requests for current user
// @route   GET /api/dates/requests
// @access  Private
exports.getPendingRequests = async (req, res, next) => {
  try {
    const requests = await DateRequest.find({
      receiver: req.user._id,
      status: 'pending'
    })
      .populate('requester', 'firstName lastName profilePhoto bio interests')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching requests'
    });
  }
};

// @desc    Accept a date request
// @route   PUT /api/dates/request/:id/accept
// @access  Private
exports.acceptDateRequest = async (req, res, next) => {
  try {
    const dateRequest = await DateRequest.findById(req.params.id);

    if (!dateRequest) {
      return res.status(404).json({
        success: false,
        message: 'Date request not found'
      });
    }

    // Check if user is the receiver
    if (dateRequest.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to accept this request'
      });
    }

    // Check if request is still pending
    if (dateRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept a ${dateRequest.status} request`
      });
    }

    // Update status
    dateRequest.status = 'accepted';
    dateRequest.responseDate = new Date();
    await dateRequest.save();
    await dateRequest.populate('requester', 'firstName lastName profilePhoto');

    // Create notification for requester
    const notification = new Notification({
      user: dateRequest.requester,
      type: 'date_accepted',
      relatedUser: req.user._id,
      relatedDateRequest: dateRequest._id,
      title: `${req.user.firstName} accepted your date request`,
      message: `${req.user.firstName} accepted your date request for ${dateRequest.preferredDate}`
    });
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Date request accepted',
      dateRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error accepting request'
    });
  }
};

// @desc    Reject a date request
// @route   PUT /api/dates/request/:id/reject
// @access  Private
exports.rejectDateRequest = async (req, res, next) => {
  try {
    const { message } = req.body;
    const dateRequest = await DateRequest.findById(req.params.id);

    if (!dateRequest) {
      return res.status(404).json({
        success: false,
        message: 'Date request not found'
      });
    }

    // Check if user is the receiver
    if (dateRequest.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this request'
      });
    }

    // Check if request is still pending
    if (dateRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject a ${dateRequest.status} request`
      });
    }

    // Update status
    dateRequest.status = 'rejected';
    dateRequest.responseDate = new Date();
    dateRequest.responseMessage = message;
    await dateRequest.save();

    // Create notification for requester
    const notification = new Notification({
      user: dateRequest.requester,
      type: 'date_rejected',
      relatedUser: req.user._id,
      relatedDateRequest: dateRequest._id,
      title: `Date request declined`,
      message: `${req.user.firstName} declined your date request`
    });
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Date request rejected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting request'
    });
  }
};

// @desc    Get all accepted dates for current user
// @route   GET /api/dates/scheduled
// @access  Private
exports.getScheduledDates = async (req, res, next) => {
  try {
    const dates = await DateRequest.find({
      $or: [
        { requester: req.user._id, status: 'accepted' },
        { receiver: req.user._id, status: 'accepted' }
      ]
    })
      .populate('requester', 'firstName lastName profilePhoto')
      .populate('receiver', 'firstName lastName profilePhoto')
      .sort({ preferredDate: 1 });

    res.status(200).json({
      success: true,
      count: dates.length,
      dates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching scheduled dates'
    });
  }
};

// @desc    Cancel an accepted date (requester or receiver can cancel)
// @route   PUT /api/dates/request/:id/cancel
// @access  Private
exports.cancelDate = async (req, res, next) => {
  try {
    const dateRequest = await DateRequest.findById(req.params.id);

    if (!dateRequest) {
      return res.status(404).json({ success: false, message: 'Cita no encontrada' });
    }

    const userId = req.user._id.toString();
    const isParticipant =
      dateRequest.requester.toString() === userId ||
      dateRequest.receiver.toString() === userId;

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'No autorizado para cancelar esta cita' });
    }

    if (dateRequest.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: `No se puede cancelar una cita con estado "${dateRequest.status}"`
      });
    }

    dateRequest.status = 'cancelled';
    dateRequest.responseDate = new Date();
    await dateRequest.save();

    // Notify the other participant
    const otherUserId =
      dateRequest.requester.toString() === userId
        ? dateRequest.receiver
        : dateRequest.requester;

    const notification = new Notification({
      user: otherUserId,
      type: 'date_cancelled',
      relatedUser: req.user._id,
      relatedDateRequest: dateRequest._id,
      title: 'Cita cancelada',
      message: `${req.user.firstName} canceló la cita del ${dateRequest.preferredDate}`
    });
    await notification.save();

    res.status(200).json({ success: true, message: 'Cita cancelada correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al cancelar la cita' });
  }
};
