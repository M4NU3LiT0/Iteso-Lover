const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      user: user.getPublicProfile()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile: ' + error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, bio, interests, careerGoal, phoneNumber } = req.body;

    // Fields that are allowed to be updated
    const allowedUpdates = {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(bio && { bio }),
      ...(interests && { interests }),
      ...(careerGoal && { careerGoal }),
      ...(phoneNumber && { phoneNumber })
    };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      allowedUpdates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: user.getPublicProfile()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile: ' + error.message
    });
  }
};

// @desc    Search users by name, interests, and gender
// @route   GET /api/users/search?q=name&interests=Sport,Music&gender=female
// @access  Private
exports.searchUsers = async (req, res, next) => {
  try {
    const { q, interests, gender } = req.query;
    let filter = { _id: { $ne: req.user._id } }; // Exclude current user

    // Search by name
    if (q) {
      filter.$or = [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } }
      ];
    }

    // Filter by gender (if specified and not "all")
    if (gender && gender !== 'all') {
      filter.gender = gender;
    }

    // Get base results
    let users = await User.find(filter)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .limit(100);

    // If interests filter is specified, prioritize users with matching interests
    if (interests) {
      const interestArray = interests.split(',').map(i => i.trim());
      
      // Score users based on matching interests
      users = users.map(user => {
        const matchingInterests = user.interests.filter(i => interestArray.includes(i)).length;
        return { ...user.toObject(), matchScore: matchingInterests };
      });

      // Sort by matching interests (descending), then by those without matching interests
      users.sort((a, b) => b.matchScore - a.matchScore);
    }

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching users: ' + error.message
    });
  }
};

// @desc    Get user by ID (public profile)
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpire');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user: ' + error.message
    });
  }
};
