"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getMe = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const User_1 = __importDefault(require("../models/User"));
const errorHandler_1 = require("../middleware/errorHandler");
const generateToken = (user) => {
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    return jsonwebtoken_1.default.sign({ id: user._id.toString(), tenantId: user.tenantId, role: user.role }, secret, { expiresIn: '7d' });
};
const sanitizeUser = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    farmName: user.farmName,
    farmLocation: user.farmLocation,
    farmSizeAcres: user.farmSizeAcres,
    phoneNumber: user.phoneNumber,
    avatar: user.avatar,
});
// POST /api/auth/register
const register = async (req, res) => {
    const { name, email, password, role, farmName, farmLocation, farmSizeAcres, phoneNumber } = req.body;
    const existing = await User_1.default.findOne({ email: email?.toLowerCase().trim() });
    if (existing) {
        throw (0, errorHandler_1.createError)('This email address is already registered', 409);
    }
    // Normalise role — accept both 'farmer' and 'FARMER' from the frontend
    const normalisedRole = (role || 'FARMER').toString().toUpperCase();
    // Each new registration creates a new tenantId (or join existing via invite — future feature)
    const tenantId = (0, uuid_1.v4)();
    const user = await User_1.default.create({
        tenantId,
        name: name?.trim(),
        email: email?.toLowerCase().trim(),
        password,
        role: normalisedRole,
        farmName: farmName?.trim(),
        farmLocation,
        farmSizeAcres,
        phoneNumber,
    });
    const token = generateToken(user);
    res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: { user: sanitizeUser(user), token },
    });
};
exports.register = register;
// POST /api/auth/login
const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw (0, errorHandler_1.createError)('Email and password are required', 400);
    }
    const user = await User_1.default.findOne({ email }).select('+password');
    if (!user || !user.isActive) {
        throw (0, errorHandler_1.createError)('Invalid credentials', 401);
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw (0, errorHandler_1.createError)('Invalid credentials', 401);
    }
    user.lastLogin = new Date();
    await user.save();
    const token = generateToken(user);
    res.status(200).json({
        success: true,
        message: 'Login successful',
        data: { user: sanitizeUser(user), token },
    });
};
exports.login = login;
// GET /api/auth/me
const getMe = async (req, res) => {
    if (!req.user) {
        throw (0, errorHandler_1.createError)('Not authenticated', 401);
    }
    res.status(200).json({
        success: true,
        data: { user: sanitizeUser(req.user) },
    });
};
exports.getMe = getMe;
// PUT /api/auth/profile
const updateProfile = async (req, res) => {
    if (!req.user) {
        throw (0, errorHandler_1.createError)('Not authenticated', 401);
    }
    const allowed = ['name', 'farmName', 'farmLocation', 'farmSizeAcres', 'phoneNumber', 'avatar'];
    const updates = {};
    allowed.forEach((field) => {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    });
    const updated = await User_1.default.findByIdAndUpdate(req.user._id, updates, {
        new: true,
        runValidators: true,
    });
    res.status(200).json({
        success: true,
        message: 'Profile updated',
        data: { user: sanitizeUser(updated) },
    });
};
exports.updateProfile = updateProfile;
//# sourceMappingURL=authController.js.map