const express = require('express');
const multer = require('multer');
const { uploadProfilePhoto, deleteProfilePhoto, getPresignedUrl } = require('../controllers/upload.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (JPEG, PNG, WebP)'));
    }
  }
});

// All routes require authentication
router.use(protect);

// Routes
router.post('/profile-photo', upload.single('photo'), uploadProfilePhoto);
router.delete('/profile-photo', deleteProfilePhoto);
router.post('/presigned-url', getPresignedUrl);

module.exports = router;
