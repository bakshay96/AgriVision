"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/register', (0, express_async_handler_1.default)(authController_1.register));
router.post('/login', (0, express_async_handler_1.default)(authController_1.login));
router.get('/me', auth_1.protect, (0, express_async_handler_1.default)(authController_1.getMe));
router.put('/profile', auth_1.protect, (0, express_async_handler_1.default)(authController_1.updateProfile));
exports.default = router;
//# sourceMappingURL=auth.js.map