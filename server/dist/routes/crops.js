"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const cropController_1 = require("../controllers/cropController");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const router = (0, express_1.Router)();
router.use(auth_1.protect, tenant_1.tenantIsolation);
// Multer for memory storage
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
router.get('/stats/summary', cropController_1.getCropStats);
router.route('/').get(cropController_1.getCrops).post(cropController_1.createCrop);
router.route('/:id').get(cropController_1.getCropById).put(cropController_1.updateCrop).delete(cropController_1.deleteCrop);
router.post('/:id/images', upload.single('image'), cropController_1.uploadCropImage);
exports.default = router;
//# sourceMappingURL=crops.js.map