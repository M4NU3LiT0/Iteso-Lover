const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // Personal Info
    firstName: {
      type: String,
      required: [true, 'Please provide a first name'],
      trim: true,
      minlength: 2,
      maxlength: 50
    },
    lastName: {
      type: String,
      required: [true, 'Please provide a last name'],
      trim: true,
      minlength: 2,
      maxlength: 50
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@iteso\.mx$/,
        'Please use a valid ITESO email (@iteso.mx)'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't return password by default
      validate: {
        validator: function(password) {
          // Must have uppercase, lowercase, and number
          return /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password);
        },
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      }
    },
    // Profile Info
    bio: {
      type: String,
      maxlength: 500,
      default: ''
    },
    profilePhoto: {
      type: String, // S3 URL
      default: null
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', ''],
      default: ''
    },
    phoneNumber: {
      type: String,
      default: null,
      match: [/^\+?[0-9]{10,}$/, 'Please provide a valid phone number']
    },
    // Interests/Preferences
    interests: {
      type: [String],
      enum: ['Sports', 'Music', 'Art', 'Technology', 'Travel', 'Food', 'Movies', 'Books', 'Gaming', 'Fashion', 'Science', 'Nature'],
      default: []
    },
    careerGoal: {
      type: String,
      maxlength: 200,
      default: ''
    },
    // Status
    isActive: {
      type: Boolean,
      default: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    lastLogin: {
      type: Date,
      default: null
    },
    // Account Security
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true
  }
);

// ============ MIDDLEWARE HOOKS ============

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash if password is new or modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ============ METHODS ============

// Compare password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

// Get public profile (exclude sensitive data)
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpire;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
