const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const dateRoutes = require('./routes/date.routes');
const messageRoutes = require('./routes/message.routes');
const uploadRoutes = require('./routes/upload.routes');
const blockRoutes = require('./routes/block.routes');
const photoRoutes = require('./routes/photo.routes');
const adminRoutes = require('./routes/admin.routes');

const { setCsrfCookie, verifyCsrf } = require('./middleware/csrf');

// ============ ENVIRONMENT VALIDATION ============
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'FRONTEND_URL'];
const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v]);
if (missingEnvVars.length > 0) {
  console.error(`FATAL: Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const app = express();

// ============ SECURITY MIDDLEWARE ============

// Helmet - HTTP security headers including CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
      }
    },
    hsts: process.env.NODE_ENV === 'production'
      ? { maxAge: 31536000, includeSubDomains: true }
      : false,
    crossOriginEmbedderPolicy: false
  })
);

// CORS - allow credentials so httpOnly cookies are sent
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
  })
);

// Cookie parser must come before routes so req.cookies is available
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, message: 'Too many login attempts, please try again later.' }
});

// Structured request logging
app.use(morgan('combined'));

// ============ BODY PARSER ============
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// ============ CSRF ============
// Set CSRF cookie on every request (no-op if already set)
app.use(setCsrfCookie);

// Apply CSRF validation to all state-changing requests except public auth endpoints
const csrfExemptPaths = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password'
];
app.use((req, res, next) => {
  if (csrfExemptPaths.some((p) => req.path.startsWith(p))) return next();
  return verifyCsrf(req, res, next);
});

// ============ ROUTES ============
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dates', dateRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', blockRoutes);

// Health check (no CSRF needed)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ============ ERROR HANDLING ============
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err.message);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join(', ') });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({ success: false, message: `${field} already registered` });
  }

  // Never leak stack traces in production
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    success: false,
    message: isProduction ? 'An unexpected error occurred' : (err.message || 'Internal server error'),
    ...((!isProduction) && { stack: err.stack })
  });
});

module.exports = app;
