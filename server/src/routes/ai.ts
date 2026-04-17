import { Router, Request } from 'express';
import multer from 'multer';
import {
  analyzeImage,
  scanCrop,
  getAnalyses,
  getAnalysisById,
  archiveAnalysis,
} from '../controllers/aiController';
import { protect } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenant';
import { createError } from '../middleware/errorHandler';

// ─────────────────────────────────────────────────────────────────────────────
// Security constants
// ─────────────────────────────────────────────────────────────────────────────
const ALLOWED_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB hard cap

// ─────────────────────────────────────────────────────────────────────────────
// Shared MIME-type filter (used by both upload configs)
// ─────────────────────────────────────────────────────────────────────────────
const mimeFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(createError('Only JPEG, PNG and WebP images are accepted', 415) as unknown as null, false);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// /scan  — MEMORY storage (no disk writes, buffer is GC'd after response)
// This is the primary endpoint used by the CropScanner component.
// ─────────────────────────────────────────────────────────────────────────────
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: mimeFilter,
  limits: {
    fileSize: MAX_SIZE_BYTES,
    files: 1,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// /analyze  — DISK storage (legacy route, kept for backward compat)
// ─────────────────────────────────────────────────────────────────────────────
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const diskUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename:    (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
  }),
  fileFilter: mimeFilter,
  limits: { fileSize: MAX_SIZE_BYTES, files: 1 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────────────────────
const router = Router();
router.use(protect, tenantIsolation);

// Primary: memory-based scan (file.buffer available, no disk writes)
router.post('/scan', memoryUpload.single('image'), scanCrop);

// Legacy: disk-based analyze (kept for existing integrations)
router.post('/analyze', diskUpload.single('image'), analyzeImage);

router.get('/analyses',     getAnalyses);
router.get('/analyses/:id', getAnalysisById);
router.delete('/analyses/:id', archiveAnalysis);

export default router;
