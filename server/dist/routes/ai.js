"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const aiController_1 = require("../controllers/aiController");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const errorHandler_1 = require("../middleware/errorHandler");
// ─────────────────────────────────────────────────────────────────────────────
// Security constants
// ─────────────────────────────────────────────────────────────────────────────
const ALLOWED_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB hard cap
// ─────────────────────────────────────────────────────────────────────────────
// Shared MIME-type filter (used by both upload configs)
// ─────────────────────────────────────────────────────────────────────────────
const mimeFilter = (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb((0, errorHandler_1.createError)('Only JPEG, PNG and WebP images are accepted', 415), false);
    }
};
// ─────────────────────────────────────────────────────────────────────────────
// /scan  — MEMORY storage (no disk writes, buffer is GC'd after response)
// This is the primary endpoint used by the CropScanner component.
// ─────────────────────────────────────────────────────────────────────────────
const memoryUpload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    fileFilter: mimeFilter,
    limits: {
        fileSize: MAX_SIZE_BYTES,
        files: 1,
    },
});
// ─────────────────────────────────────────────────────────────────────────────
// /analyze  — DISK storage (legacy route, kept for backward compat)
// ─────────────────────────────────────────────────────────────────────────────
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const uploadsDir = path_1.default.join(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(uploadsDir))
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
const diskUpload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (_req, _file, cb) => cb(null, uploadsDir),
        filename: (_req, file, cb) => cb(null, `${(0, uuid_1.v4)()}${path_1.default.extname(file.originalname)}`),
    }),
    fileFilter: mimeFilter,
    limits: { fileSize: MAX_SIZE_BYTES, files: 1 },
});
// ─────────────────────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────────────────────
const router = (0, express_1.Router)();
router.use(auth_1.protect, tenant_1.tenantIsolation);
// Primary: disk-based scan (saves image as requested by user)
router.post('/scan', diskUpload.single('image'), aiController_1.scanCrop);
// Legacy: disk-based analyze (kept for existing integrations)
router.post('/analyze', diskUpload.single('image'), aiController_1.analyzeImage);
router.get('/analyses', aiController_1.getAnalyses);
router.get('/analyses/:id', aiController_1.getAnalysisById);
router.delete('/analyses/:id', aiController_1.archiveAnalysis);
exports.default = router;
//# sourceMappingURL=ai.js.map