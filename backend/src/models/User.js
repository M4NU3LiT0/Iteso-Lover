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
      match: [/^\+?\d{10,}$/, 'Please provide a valid phone number']
    },
    birthDate: {
      type: Date,
      default: null
    },
    careerName: {
      type: String,
      maxlength: 100,
      default: ''
    },
    // Interests/Preferences
    interests: {
      type: [String],
      enum: [
        'Deportes', 'Música', 'Arte', 'Tecnología', 'Viajes', 'Comida', 'Películas', 'Libros',
        'Gaming', 'Moda', 'Ciencia', 'Naturaleza', 'Fotografía', 'Baile', 'Fitness', 'Yoga',
        'Emprendimiento', 'Política', 'Cocina', 'Animales', 'Teatro', 'Idiomas', 'Voluntariado',
        'Meditación', 'Astronomía'
      ],
      default: []
    },
    careerGoal: {
      type: String,
      maxlength: 200,
      default: ''
    },
    // Preferences
    preferences: {
      interestedIn: {
        type: String,
        enum: ['male', 'female', 'other', 'all'],
        default: 'all'
      }
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
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    lastLogin: {
      type: Date,
      default: null
    },
    // Account Security
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Date
    },
    refreshTokenVersion: {
      type: Number,
      default: 0,
      select: false
    },
    // Social
    blockedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
  },
  {
    timestamps: true
  }
);

// ============ MIDDLEWARE HOOKS ============

// Hash password before saving
userSchema.pre('save', async function() {
  // Only hash if password is new or modified
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcryptjs.genSalt(10);
  this.password = await bcryptjs.hash(this.password, salt);
});

// ============ METHODS ============

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

userSchema.methods.incrementLoginAttempts = async function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + LOCK_DURATION_MS };
  }
  return this.updateOne(updates);
};

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
