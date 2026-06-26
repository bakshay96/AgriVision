import express from 'express';
import multer from 'multer';
import {
  uploadImage,
  uploadMultipleImages,
  getUploadConfiguration,
  uploadAndAnalyze,
  getMyImages,
  deleteUpload,
  proxyImage,
} from '../controllers/uploadController';
import { protect } from '../middleware/auth';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Multer Configuration - Memory Storage (no disk I/O)
// ─────────────────────────────────────────────────────────────────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 5, // Max 5 files for multiple upload
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
      // Audio
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/m4a', 'audio/x-m4a', 'audio/mp4', 'audio/aac', 'audio/3gpp',
      // Video
      'video/mp4', 'video/quicktime', 'video/webm', 'video/ogg', 'video/x-matroska', 'video/avi', 'video/3gpp',
      // Documents
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: images, audio, video, pdf, doc, xls.`));
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Upload Routes
// ─────────────────────────────────────────────────────────────────────────────

// Public proxy route for short URLs
router.get('/raw/:id', proxyImage);

// Get upload configuration (public)
router.get('/config', getUploadConfiguration);

// Get user's uploaded images (private)
router.get('/my-images', protect, getMyImages);

// Upload single image (private)
router.post(
  '/image',
  protect,
  upload.single('image'),
  uploadImage
);

// Upload multiple images (private)
router.post(
  '/images',
  protect,
  upload.array('images', 5),
  uploadMultipleImages
);

// Upload and analyze crop image (private)
router.post(
  '/analyze',
  protect,
  upload.single('image'),
  uploadAndAnalyze
);

// Delete image from S3 and DB (private)
router.delete('/:id', protect, deleteUpload);

export default router;
