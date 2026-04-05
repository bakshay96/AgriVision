"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            res.status(401).json({ success: false, message: 'Not authorized. No token.' });
            return;
        }
        const secret = process.env.JWT_SECRET || 'fallback_secret';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        const user = await User_1.default.findById(decoded.id).select('-password');
        if (!user || !user.isActive) {
            res.status(401).json({ success: false, message: 'User not found or inactive.' });
            return;
        }
        req.user = user;
        req.tenantId = decoded.tenantId;
        next();
    }
    catch (error) {
        res.status(401).json({ success: false, message: 'Token is invalid or expired.' });
    }
};
exports.protect = protect;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated.' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: `Role '${req.user.role}' is not authorized for this route.`,
            });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=auth.js.map