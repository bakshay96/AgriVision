"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const uploadController_1 = require("../controllers/uploadController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// ─────────────────────────────────────────────────────────────────────────────
// Multer Configuration - Memory Storage (no disk I/O)
// ─────────────────────────────────────────────────────────────────────────────
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
        files: 5, // Max 5 files for multiple upload
    },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: ${allowedTypes.join(', ')}`));
        }
    },
});
// ─────────────────────────────────────────────────────────────────────────────
// Upload Routes
// ─────────────────────────────────────────────────────────────────────────────
// Get upload configuration (public)
router.get('/config', uploadController_1.getUploadConfiguration);
// Upload single image (private)
router.post('/image', auth_1.protect, upload.single('image'), uploadController_1.uploadImage);
// Upload multiple images (private)
router.post('/images', auth_1.protect, upload.array('images', 5), uploadController_1.uploadMultipleImages);
// Upload and analyze crop image (private)
router.post('/analyze', auth_1.protect, upload.single('image'), uploadController_1.uploadAndAnalyze);
exports.default = router;
//# sourceMappingURL=upload.js.map