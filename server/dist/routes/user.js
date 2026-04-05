"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.protect);
// Profile routes
router.get('/profile', userController_1.getProfile);
router.put('/profile', userController_1.updateProfile);
// Selected crops routes
router.get('/crops', userController_1.getSelectedCrops);
router.post('/crops', userController_1.addSelectedCrop);
router.put('/crops', userController_1.updateSelectedCrops);
router.delete('/crops/:cropName', userController_1.removeSelectedCrop);
exports.default = router;
//# sourceMappingURL=user.js.map