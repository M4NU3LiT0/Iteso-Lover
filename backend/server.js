require('dotenv').config();

const app = require('./src/app');
const mongoose = require('mongoose');
const http = require('node:http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Active user map: userId -> { socketId, connectedAt }
const activeUsers = new Map();

// ── Socket rate limiting ──────────────────────────────────────────────────────
// Per-user sliding window: max 30 messages per minute
const msgRateLimit = new Map();
const MSG_WINDOW_MS = 60 * 1000;
const MSG_MAX = 120;

const isRateLimited = (userId) => {
  const now = Date.now();
  const entry = msgRateLimit.get(userId) || { count: 0, resetAt: now + MSG_WINDOW_MS };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + MSG_WINDOW_MS;
  }

  entry.count += 1;
  msgRateLimit.set(userId, entry);
  return entry.count > MSG_MAX;
};

// ── Socket.io authentication middleware ──────────────────────────────────────
// Reads the access_token from the httpOnly cookie sent with the WS upgrade request
io.use((socket, next) => {
  try {
    // Browser sends cookies automatically on WS upgrade when withCredentials is true
    const cookieHeader = socket.handshake.headers.cookie || '';
    const tokenMatch = cookieHeader.match(/(?:^|;\s*)access_token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : socket.handshake.auth?.token; // fallback for dev

    if (!token) return next(new Error('Authentication error: no token'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error(`Authentication error: ${err.message}`));
  }
});

// ── Socket.io connection handlers ─────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId}`);

  activeUsers.set(socket.userId, { socketId: socket.id, connectedAt: new Date() });
  socket.broadcast.emit('user-online', socket.userId);

  // Send message (rate limited)
  socket.on('send-message', (data) => {
    if (isRateLimited(socket.userId)) {
      socket.emit('error', { message: 'Message rate limit exceeded. Please slow down.' });
      return;
    }

    const { receiverId, content } = data;
    if (!receiverId || !content) return;

    const receiverEntry = activeUsers.get(receiverId);
    if (receiverEntry) {
      io.to(receiverEntry.socketId).emit('receive-message', {
        senderId: socket.userId,
        content,
        timestamp: new Date()
      });
    }
  });

  // Typing indicator (rate limited — same window as messages)
  socket.on('typing', (data) => {
    const { receiverId } = data;
    const receiverEntry = activeUsers.get(receiverId);
    if (receiverEntry) {
      io.to(receiverEntry.socketId).emit('user-typing', { senderId: socket.userId });
    }
  });

  // Mark messages as read
  socket.on('mark-as-read', (data) => {
    const { senderId } = data;
    const senderEntry = activeUsers.get(senderId);
    if (senderEntry) {
      io.to(senderEntry.socketId).emit('message-read', { receiverId: socket.userId });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
    activeUsers.delete(socket.userId);
    socket.broadcast.emit('user-offline', socket.userId);
    msgRateLimit.delete(socket.userId);
  });
});

// ── MongoDB connection ────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  process.exit(1);
});
