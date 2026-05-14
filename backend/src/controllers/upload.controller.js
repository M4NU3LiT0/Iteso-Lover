const { S3Client, DeleteObjectCommand, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const User = require('../models/User');
const { logSecurityEvent } = require('../utils/auditLogger');

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

// Delete a file from S3 by its full URL (best-effort; won't crash if it fails)
const deleteFromS3 = async (fileUrl) => {
  if (!fileUrl) return;
  try {
    const url = new URL(fileUrl);
    const key = url.pathname.substring(1);
    await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: key }));
  } catch (err) {
    console.error('S3 delete error (non-fatal):', err.message);
  }
};

// POST /api/upload/profile-photo
exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ success: false, message: 'Only JPEG, PNG and WebP images are allowed' });
    }

    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'File size must not exceed 5MB' });
    }

    const userId = req.user.id;
    const timestamp = Date.now();
    const key = `profile-photos/${userId}/${timestamp}-${req.file.originalname}`;

    // Upload as private — no public ACL
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    });
    await s3.send(command);

    // Generate the S3 URL
    const result = { Location: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${region}.amazonaws.com/${key}` };

    // Delete the previous profile photo to avoid orphaned files in S3
    const existingUser = await User.findById(userId);
    await deleteFromS3(existingUser?.profilePhoto);

    const user = await User.findByIdAndUpdate(userId, { profilePhoto: result.Location }, { new: true });

    await logSecurityEvent('profile_photo_uploaded', req, { userId }, 'info');

    return res.status(200).json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: { url: result.Location, user }
    });
  } catch (error) {
    console.error('S3 Upload Error:', error);
    return res.status(500).json({ success: false, message: 'Error uploading file' });
  }
};

// DELETE /api/upload/profile-photo
exports.deleteProfilePhoto = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user?.profilePhoto) {
      return res.status(400).json({ success: false, message: 'No profile photo to delete' });
    }

    await deleteFromS3(user.profilePhoto);

    const updatedUser = await User.findByIdAndUpdate(userId, { profilePhoto: null }, { new: true });

    await logSecurityEvent('profile_photo_deleted', req, { userId }, 'info');

    return res.status(200).json({ success: true, message: 'Profile photo deleted', user: updatedUser });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error deleting photo' });
  }
};

// POST /api/upload/presigned-url — client-side direct upload
exports.getPresignedUrl = async (req, res) => {
  try {
    const userId = req.user.id;
    const { filename, filetype } = req.body;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(filetype)) {
      return res.status(400).json({ success: false, message: 'Only JPEG, PNG and WebP images are allowed' });
    }

    const key = `profile-photos/${userId}/${Date.now()}-${filename}`;
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      ContentType: filetype
    });
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return res.status(200).json({ success: true, uploadUrl: url, fileKey: key });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error generating presigned URL' });
  }
};
