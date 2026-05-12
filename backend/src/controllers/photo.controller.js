const AWS = require('aws-sdk');
const Photo = require('../models/Photo');
const { logSecurityEvent } = require('../utils/auditLogger');

const MAX_PHOTOS_PER_USER = 6;

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_S3_REGION
});

const deleteS3Key = async (key) => {
  try {
    await s3.deleteObject({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: key }).promise();
  } catch (err) {
    console.error('S3 delete error:', err.message);
  }
};

// POST /api/photos
exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    const userId = req.user.id;
    const count = await Photo.countDocuments({ user: userId });
    if (count >= MAX_PHOTOS_PER_USER) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${MAX_PHOTOS_PER_USER} photos allowed per user`
      });
    }

    const key = `gallery-photos/${userId}/${Date.now()}-${req.file.originalname}`;
    const result = await s3
      .upload({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      })
      .promise();

    const photo = await Photo.create({ user: userId, url: result.Location, s3Key: key, order: count });

    await logSecurityEvent('profile_photo_uploaded', req, { userId, photoId: photo._id }, 'info');

    return res.status(201).json({ success: true, photo });
  } catch (error) {
    console.error('Photo upload error:', error);
    return res.status(500).json({ success: false, message: 'Error uploading photo' });
  }
};

// GET /api/photos — current user's gallery
exports.getMyPhotos = async (req, res) => {
  try {
    const photos = await Photo.find({ user: req.user.id }).sort({ order: 1 });
    return res.status(200).json({ success: true, photos });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching photos' });
  }
};

// GET /api/users/:id/photos — another user's gallery (public)
exports.getUserPhotos = async (req, res) => {
  try {
    const photos = await Photo.find({ user: req.params.id }).sort({ order: 1 });
    return res.status(200).json({ success: true, photos });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching photos' });
  }
};

// DELETE /api/photos/:id
exports.deletePhoto = async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ success: false, message: 'Photo not found' });
    }
    if (photo.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await deleteS3Key(photo.s3Key);
    await Photo.findByIdAndDelete(photo._id);

    // Re-sequence order for remaining photos
    const remaining = await Photo.find({ user: req.user.id }).sort({ order: 1 });
    await Promise.all(remaining.map((p, i) => Photo.findByIdAndUpdate(p._id, { order: i })));

    await logSecurityEvent('profile_photo_deleted', req, { userId: req.user.id, photoId: photo._id }, 'info');

    return res.status(200).json({ success: true, message: 'Photo deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error deleting photo' });
  }
};

// PUT /api/photos/reorder — body: [{ id, order }]
exports.reorderPhotos = async (req, res) => {
  try {
    const { photos } = req.body;
    if (!Array.isArray(photos)) {
      return res.status(400).json({ success: false, message: 'photos array is required' });
    }

    await Promise.all(
      photos.map(({ id, order }) =>
        Photo.findOneAndUpdate({ _id: id, user: req.user.id }, { order })
      )
    );

    const updated = await Photo.find({ user: req.user.id }).sort({ order: 1 });
    return res.status(200).json({ success: true, photos: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error reordering photos' });
  }
};
