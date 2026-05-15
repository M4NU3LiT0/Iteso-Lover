const crypto = require('crypto');
const User = require('../models/User');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');
const { validateEmail, validatePassword } = require('../utils/validators');
const { logSecurityEvent } = require('../utils/auditLogger');

// ─── Cookie helpers ──────────────────────────────────────────────────────────

const COOKIE_BASE = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  secure: process.env.NODE_ENV === 'production'
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('access_token', accessToken, {
    ...COOKIE_BASE,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  res.cookie('refresh_token', refreshToken, {
    ...COOKIE_BASE,
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie('access_token', COOKIE_BASE);
  res.clearCookie('refresh_token', COOKIE_BASE);
};

// ─── Register ────────────────────────────────────────────────────────────────

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, passwordConfirm } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please use a valid ITESO email (@iteso.mx)' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and contain uppercase, lowercase, and numbers'
      });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await new User({ firstName, lastName, email, password }).save();

    const { accessToken, refreshToken } = generateTokens(user._id, 0);
    setAuthCookies(res, accessToken, refreshToken);

    await logSecurityEvent('register', req, { userId: user._id, email }, 'info');

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: user.getPublicProfile(),
      tokens: { accessToken, refreshToken }
    });
  } catch (error) {
    console.error('Register error:', error.message);
    return res.status(500).json({ success: false, message: 'Error during registration' });
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil +refreshTokenVersion');

    // Always run bcrypt comparison to prevent timing attacks
    const dummyHash = '$2a$10$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const passwordToCheck = user ? user.password : dummyHash;

    if (!user) {
      await require('bcryptjs').compare(password, passwordToCheck);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is inactive' });
    }

    if (user.isLocked()) {
      const remainingMin = Math.ceil((user.lockUntil - Date.now()) / 60000);
      await logSecurityEvent('login_locked', req, { email }, 'warning');
      return res.status(423).json({
        success: false,
        message: `Account locked due to too many failed attempts. Try again in ${remainingMin} minute(s).`
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      await logSecurityEvent('login_failed', req, { email }, 'warning');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Successful login — reset lockout counters
    await user.updateOne({ $set: { loginAttempts: 0, lastLogin: new Date() }, $unset: { lockUntil: 1 } });

    const version = user.refreshTokenVersion ?? 0;
    const { accessToken, refreshToken } = generateTokens(user._id, version);
    setAuthCookies(res, accessToken, refreshToken);

    await logSecurityEvent('login_success', req, { userId: user._id }, 'info');

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: user.getPublicProfile(),
      tokens: { accessToken, refreshToken }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ success: false, message: 'Error during login' });
  }
};

// ─── Logout ──────────────────────────────────────────────────────────────────

exports.logout = async (req, res) => {
  try {
    clearAuthCookies(res);
    await logSecurityEvent('logout', req, { userId: req.user?._id }, 'info');
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error during logout' });
  }
};

// ─── Refresh token ───────────────────────────────────────────────────────────

exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refresh_token;
    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token' });
    }

    const decoded = verifyRefreshToken(token);
    if (!decoded) {
      clearAuthCookies(res);
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.id).select('+refreshTokenVersion');
    if (!user || !user.isActive) {
      clearAuthCookies(res);
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Detect refresh token reuse (indicates possible theft)
    if (decoded.version !== undefined && decoded.version !== user.refreshTokenVersion) {
      // Invalidate all tokens for this user by bumping the version
      await user.updateOne({ $inc: { refreshTokenVersion: 1 } });
      clearAuthCookies(res);
      await logSecurityEvent('token_reuse_detected', req, { userId: user._id }, 'critical');
      return res.status(401).json({
        success: false,
        message: 'Token reuse detected. Please login again.'
      });
    }

    // Rotate: increment version and issue new pair
    const newVersion = (user.refreshTokenVersion ?? 0) + 1;
    await user.updateOne({ $set: { refreshTokenVersion: newVersion } });

    const { accessToken, refreshToken } = generateTokens(user._id, newVersion);
    setAuthCookies(res, accessToken, refreshToken);

    await logSecurityEvent('token_refresh', req, { userId: user._id }, 'info');

    return res.status(200).json({ success: true, user: user.getPublicProfile() });
  } catch (error) {
    console.error('Refresh error:', error.message);
    return res.status(500).json({ success: false, message: 'Error refreshing token' });
  }
};

// ─── Forgot password ─────────────────────────────────────────────────────────

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Always respond the same way to avoid user enumeration
    const genericResponse = { success: true, message: 'If that email is registered, a reset link was sent.' };

    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(200).json(genericResponse);

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    await logSecurityEvent('password_reset_requested', req, { email: user.email }, 'info');

    // In a real app, send an email here.
    // During development the plain token is returned so it can be tested without email setup.
    const responsePayload = { ...genericResponse };
    if (process.env.NODE_ENV !== 'production') {
      responsePayload.resetToken = resetToken;
    }

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error('Forgot password error:', error.message);
    return res.status(500).json({ success: false, message: 'Error processing request' });
  }
};

// ─── Reset password ──────────────────────────────────────────────────────────

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, passwordConfirm } = req.body;

    if (!password || !passwordConfirm) {
      return res.status(400).json({ success: false, message: 'Password and confirmation are required' });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and contain uppercase, lowercase, and numbers'
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    // Invalidate all existing sessions by bumping the refresh token version
    user.refreshTokenVersion = (user.refreshTokenVersion ?? 0) + 1;
    await user.save();

    clearAuthCookies(res);

    await logSecurityEvent('password_reset_completed', req, { userId: user._id }, 'info');

    return res.status(200).json({ success: true, message: 'Password reset successfully. Please login again.' });
  } catch (error) {
    console.error('Reset password error:', error.message);
    return res.status(500).json({ success: false, message: 'Error resetting password' });
  }
};
