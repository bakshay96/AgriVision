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
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: ${allowedTypes.join(', ')}`));
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
