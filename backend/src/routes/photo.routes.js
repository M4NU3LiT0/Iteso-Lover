const express = require('express');
const multer = require('multer');
const { uploadPhoto, getMyPhotos, deletePhoto, reorderPhotos } = require('../controllers/photo.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/jpeg|jpg|png|webp/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG and WebP images are allowed'));
  }
});

router.use(protect);

router.post('/', upload.single('photo'), uploadPhoto);
router.get('/', getMyPhotos);
router.delete('/:id', deletePhoto);
router.put('/reorder', reorderPhotos);

module.exports = router;
