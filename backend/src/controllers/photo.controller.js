const { S3Client, DeleteObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const Photo = require('../models/Photo');
const { logSecurityEvent } = require('../utils/auditLogger');

const MAX_PHOTOS_PER_USER = 6;

const validRegions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-southeast-2'];
const region = process.env.AWS_S3_REGION;

if (!region || !validRegions.includes(region)) {
  throw new Error(`Invalid or missing AWS region: ${region}. Must be one of: ${validRegions.join(', ')}`);
}

const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const deleteS3Key = async (key) => {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: key }));
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
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    });
    await s3.send(command);

    const url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
    const photo = await Photo.create({ user: userId, url, s3Key: key, order: count });

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
