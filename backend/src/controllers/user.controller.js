const User = require('../models/User');
const DateRequest = require('../models/DateRequest');
const { calculateCompatibility } = require('../utils/compatibility');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SAFE_SELECT = '-password -resetPasswordToken -resetPasswordExpire -loginAttempts -lockUntil -refreshTokenVersion';

// GET /api/users/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    return res.status(200).json({ success: true, user: user.getPublicProfile() });
  } catch {
    return res.status(500).json({ success: false, message: 'Error fetching profile' });
  }
};

// PUT /api/users/profile
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, bio, interests, careerGoal, careerName, birthDate, phoneNumber, preferences } = req.body;

    const allowedUpdates = {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(bio !== undefined && { bio }),
      ...(interests && { interests }),
      ...(careerGoal !== undefined && { careerGoal }),
      ...(careerName !== undefined && { careerName }),
      ...(birthDate !== undefined && { birthDate }),
      ...(phoneNumber !== undefined && { phoneNumber }),
      ...(preferences && { preferences })
    };

    const user = await User.findByIdAndUpdate(req.user._id, allowedUpdates, {
      returnDocument: 'after',
      runValidators: true
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: user.getPublicProfile()
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating profile' });
  }
};

// GET /api/users/search?q=&interests=&gender=&career=&minAge=&maxAge=
exports.searchUsers = async (req, res) => {
  try {
    const { q, interests, gender, career, minAge, maxAge } = req.query;

    const currentUser = await User.findById(req.user._id).select('interests preferences blockedUsers gender');
    const blockedIds = currentUser.blockedUsers || [];

    // Get users already sent requests to (pending or accepted)
    const sentRequests = await DateRequest.find({
      requester: req.user._id,
      status: { $in: ['pending', 'accepted'] }
    }).select('receiver');
    const sentToIds = sentRequests.map(req => req.receiver.toString());

    let filter = { _id: { $ne: req.user._id, $nin: [...blockedIds, ...sentToIds] }, isActive: true };

    if (q) {
      const safe = escapeRegex(String(q).slice(0, 50));
      filter.$or = [
        { firstName: { $regex: safe, $options: 'i' } },
        { lastName: { $regex: safe, $options: 'i' } },
        { careerName: { $regex: safe, $options: 'i' } }
      ];
    }

    if (gender && gender !== 'all') filter.gender = gender;

    if (career) {
      const safeCareer = escapeRegex(String(career).slice(0, 100));
      filter.careerName = { $regex: safeCareer, $options: 'i' };
    }

    if (minAge || maxAge) {
      const today = new Date();
      filter.birthDate = {};
      if (minAge) {
        const d = new Date(today);
        d.setFullYear(d.getFullYear() - parseInt(minAge));
        filter.birthDate.$lte = d;
      }
      if (maxAge) {
        const d = new Date(today);
        d.setFullYear(d.getFullYear() - parseInt(maxAge) - 1);
        filter.birthDate.$gte = d;
      }
    }

    let users = await User.find(filter).select(SAFE_SELECT).limit(50);

    const interestFilter = interests
      ? new Set(interests.split(',').map((i) => i.trim()).slice(0, 25))
      : null;

    users = users
      .map((u) => {
        const score = calculateCompatibility(currentUser, u);
        const obj = { ...u.toObject(), compatibilityScore: score };
        if (interestFilter) {
          obj.matchScore = u.interests.filter((i) => interestFilter.has(i)).length;
        }
        return obj;
      })
      .sort((a, b) => {
        if (interestFilter) return b.matchScore - a.matchScore || b.compatibilityScore - a.compatibilityScore;
        return b.compatibilityScore - a.compatibilityScore;
      });

    return res.status(200).json({ success: true, count: users.length, users });
  } catch {
    return res.status(500).json({ success: false, message: 'Error searching users' });
  }
};

// GET /api/users/compatible — top matches sorted by compatibility score
exports.getCompatibleUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).select(
      'interests preferences blockedUsers gender'
    );

    const blockedIds = currentUser.blockedUsers || [];

    // Get users already sent requests to (pending or accepted)
    const sentRequests = await DateRequest.find({
      requester: req.user._id,
      status: { $in: ['pending', 'accepted'] }
    }).select('receiver');
    const sentToIds = sentRequests.map(req => req.receiver.toString());

    // Apply preference filter if set
    const prefFilter =
      currentUser.preferences?.interestedIn && currentUser.preferences.interestedIn !== 'all'
        ? { gender: currentUser.preferences.interestedIn }
        : {};

    const candidates = await User.find({
      _id: { $ne: req.user._id, $nin: [...blockedIds, ...sentToIds] },
      isActive: true,
      ...prefFilter
    })
      .select(SAFE_SELECT)
      .limit(100);

    const scored = candidates
      .map((u) => ({ ...u.toObject(), compatibilityScore: calculateCompatibility(currentUser, u) }))
      .filter((u) => u.compatibilityScore > 0)
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, 20);

    return res.status(200).json({ success: true, count: scored.length, users: scored });
  } catch {
    return res.status(500).json({ success: false, message: 'Error fetching compatible users' });
  }
};

// GET /api/users/:id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      `${SAFE_SELECT} -blockedUsers`
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.status(200).json({ success: true, user });
  } catch {
    return res.status(500).json({ success: false, message: 'Error fetching user' });
  }
};
