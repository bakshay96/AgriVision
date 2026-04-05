import express from 'express';
import multer from 'multer';
import {
  uploadImage,
  uploadMultipleImages,
  getUploadConfiguration,
  uploadAndAnalyze,
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
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
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

// Get upload configuration (public)
router.get('/config', getUploadConfiguration);

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

export default router;
