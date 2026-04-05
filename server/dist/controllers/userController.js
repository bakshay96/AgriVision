"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSelectedCrops = exports.removeSelectedCrop = exports.addSelectedCrop = exports.getSelectedCrops = exports.updateProfile = exports.getProfile = void 0;
const User_1 = __importDefault(require("../models/User"));
const errorHandler_1 = require("../middleware/errorHandler");
// ─── Get User Profile ───────────────────────────────────────────────────────
const getProfile = async (req, res) => {
    try {
        const userId = req.user?._id;
        const user = await User_1.default.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            data: user
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching profile',
            error: error.message
        });
    }
};
exports.getProfile = getProfile;
// ─── Update User Profile ────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
    try {
        const userId = req.user?._id;
        const updates = req.body;
        // Fields that can be updated
        const allowedUpdates = [
            'name', 'farmName', 'phoneNumber', 'avatar',
            'state', 'district', 'taluka', 'village', 'pincode',
            'preferredLanguage', 'farmSizeAcres',
            'bankDetails', 'farmLocation'
        ];
        const updateData = {};
        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) {
                updateData[field] = updates[field];
            }
        });
        const user = await User_1.default.findByIdAndUpdate(userId, { $set: updateData }, { new: true, runValidators: true }).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: user
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
};
exports.updateProfile = updateProfile;
// ─── Get User's Selected Crops ──────────────────────────────────────────────
const getSelectedCrops = async (req, res) => {
    try {
        const userId = req.user?._id;
        const user = await User_1.default.findById(userId).select('selectedCrops');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            data: {
                selectedCrops: user.selectedCrops || [],
                maxAllowed: 5,
                currentCount: (user.selectedCrops || []).length
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching selected crops',
            error: error.message
        });
    }
};
exports.getSelectedCrops = getSelectedCrops;
// ─── Add Crop to User's Selection ───────────────────────────────────────────
const addSelectedCrop = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { cropName } = req.body;
        if (!cropName) {
            throw (0, errorHandler_1.createError)('Crop name is required', 400);
        }
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const currentCrops = user.selectedCrops || [];
        // Check if already at max limit
        if (currentCrops.length >= 5) {
            return res.status(400).json({
                success: false,
                message: 'Maximum 5 crops allowed. Please remove a crop first.',
                data: { maxAllowed: 5, currentCount: currentCrops.length }
            });
        }
        // Check if crop already exists
        if (currentCrops.includes(cropName)) {
            return res.status(400).json({
                success: false,
                message: 'Crop already in your selection'
            });
        }
        // Add crop
        user.selectedCrops = [...currentCrops, cropName];
        await user.save();
        console.log('[UserController] ✅ Crop added:', {
            userId,
            cropName,
            totalCrops: user.selectedCrops.length,
            selectedCrops: user.selectedCrops
        });
        res.json({
            success: true,
            message: 'Crop added successfully',
            data: {
                selectedCrops: user.selectedCrops,
                maxAllowed: 5,
                currentCount: user.selectedCrops.length
            }
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        const statusCode = error.statusCode || 500;
        console.error('[UserController] ❌ Error adding crop:', {
            userId: req.user?._id,
            error: errorMessage,
            statusCode
        });
        return res.status(statusCode).json({
            success: false,
            message: errorMessage
        });
    }
};
exports.addSelectedCrop = addSelectedCrop;
// ─── Remove Crop from User's Selection ──────────────────────────────────────
const removeSelectedCrop = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { cropName } = req.params;
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const currentCrops = user.selectedCrops || [];
        // Check if crop exists
        if (!currentCrops.includes(cropName)) {
            return res.status(400).json({
                success: false,
                message: 'Crop not found in your selection'
            });
        }
        // Remove crop
        user.selectedCrops = currentCrops.filter(crop => crop !== cropName);
        await user.save();
        console.log('[UserController] ✅ Crop removed:', {
            userId,
            cropName,
            remainingCrops: user.selectedCrops.length,
            selectedCrops: user.selectedCrops
        });
        res.json({
            success: true,
            message: 'Crop removed successfully',
            data: {
                selectedCrops: user.selectedCrops,
                maxAllowed: 5,
                currentCount: user.selectedCrops.length
            }
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        const cropName = req.params.cropName; // Ensure cropName is available in catch block
        console.error('[UserController] ❌ Error removing crop:', {
            userId: req.user?._id,
            cropName: cropName, // Use explicit property assignment instead of shorthand
            error: errorMessage
        });
        res.status(500).json({
            success: false,
            message: 'Error removing crop',
            error: errorMessage
        });
    }
};
exports.removeSelectedCrop = removeSelectedCrop;
// ─── Update Selected Crops (Bulk) ───────────────────────────────────────────
const updateSelectedCrops = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { crops } = req.body;
        if (!Array.isArray(crops)) {
            throw (0, errorHandler_1.createError)('Crops must be an array', 400);
        }
        if (crops.length > 5) {
            throw (0, errorHandler_1.createError)('Maximum 5 crops allowed', 400);
        }
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        user.selectedCrops = crops;
        await user.save();
        console.log('[UserController] ✅ Crops updated (bulk):', {
            userId,
            totalCrops: user.selectedCrops.length,
            selectedCrops: user.selectedCrops
        });
        res.json({
            success: true,
            message: 'Crops updated successfully',
            data: {
                selectedCrops: user.selectedCrops,
                maxAllowed: 5,
                currentCount: user.selectedCrops.length
            }
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        const statusCode = error.statusCode || 500;
        console.error('[UserController] ❌ Error updating crops:', {
            userId: req.user?._id,
            error: errorMessage,
            statusCode
        });
        return res.status(statusCode).json({
            success: false,
            message: errorMessage
        });
    }
};
exports.updateSelectedCrops = updateSelectedCrops;
//# sourceMappingURL=userController.js.map