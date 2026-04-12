"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAndAnalyze = exports.getUploadConfiguration = exports.deleteUpload = exports.proxyImage = exports.getMyImages = exports.uploadMultipleImages = exports.uploadImage = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const s3Service_1 = require("../services/s3Service");
const s3_1 = require("../config/s3");
const aiService_1 = require("../services/aiService");
const Upload_1 = __importDefault(require("../models/Upload"));
// ─────────────────────────────────────────────────────────────────────────────
// Upload Controller - Handles image uploads to S3 and database tracking
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @desc    Upload single image to S3 and save to DB
 * @route   POST /api/upload/image
 * @access  Private
 */
exports.uploadImage = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.file) {
        res.status(400).json({
            success: false,
            message: 'No image file provided',
        });
        return;
    }
    const { buffer, originalname, mimetype, size } = req.file;
    const folder = req.body.folder || 'uploads';
    try {
        const result = await (0, s3Service_1.uploadBuffer)(buffer, originalname, mimetype, folder, {
            'uploaded-by': req.user?._id?.toString() || 'anonymous',
            'tenant-id': req.tenantId?.toString() || 'default',
        });
        // Save to database
        const newUpload = await Upload_1.default.create({
            tenantId: req.tenantId,
            userId: req.user?._id,
            url: result.url,
            key: result.key,
            originalName: originalname,
            size: size,
            mimeType: mimetype,
            folder: folder,
        });
        // Use direct AWS URLs as requested (presigned for visibility, base for storage)
        const viewUrl = await (0, s3Service_1.getViewUrl)(result.key);
        const baseUrl = (0, s3_1.getS3Url)(result.key);
        res.status(201).json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                ...newUpload.toObject(),
                url: viewUrl, // Direct AWS URL (presigned) for UI visibility
                baseUrl: baseUrl // Direct AWS Base URL (short) for copying
            },
        });
    }
    catch (error) {
        if (error instanceof s3Service_1.S3ServiceError) {
            res.status(error.code === 'FILE_TOO_LARGE' ? 413 : 400).json({
                success: false,
                message: error.message,
                code: error.code,
            });
            return;
        }
        throw error;
    }
});
/**
 * @desc    Upload multiple images to S3 and save to DB
 * @route   POST /api/upload/images
 * @access  Private
 */
exports.uploadMultipleImages = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        res.status(400).json({
            success: false,
            message: 'No image files provided',
        });
        return;
    }
    const folder = req.body.folder || 'uploads';
    const files = req.files;
    const uploadPromises = files.map(async (file) => {
        try {
            const result = await (0, s3Service_1.uploadBuffer)(file.buffer, file.originalname, file.mimetype, folder, {
                'uploaded-by': req.user?._id?.toString() || 'anonymous',
                'tenant-id': req.tenantId?.toString() || 'default',
            });
            // Save to database
            const newUpload = await Upload_1.default.create({
                tenantId: req.tenantId,
                userId: req.user?._id,
                url: result.url,
                key: result.key,
                originalName: file.originalname,
                size: file.size,
                mimeType: file.mimetype,
                folder: folder,
            });
            return {
                success: true,
                ...newUpload.toObject(),
            };
        }
        catch (error) {
            return {
                success: false,
                originalName: file.originalname,
                error: error instanceof s3Service_1.S3ServiceError ? error.message : 'Upload failed',
            };
        }
    });
    const results = await Promise.all(uploadPromises);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    res.status(failed.length === 0 ? 201 : 207).json({
        success: failed.length === 0,
        message: `Uploaded ${successful.length} of ${files.length} images`,
        data: {
            successful,
            failed,
        },
    });
});
/**
 * @desc    Get user's uploaded images
 * @route   GET /api/upload/my-images
 * @access  Private
 */
exports.getMyImages = (0, express_async_handler_1.default)(async (req, res) => {
    const images = await Upload_1.default.find({
        userId: req.user?._id,
        isActive: true
    }).sort({ createdAt: -1 });
    // Map results to include both direct AWS view URLs and short base URLs
    const imagesWithUrls = await Promise.all(images.map(async (img) => {
        const viewUrl = await (0, s3Service_1.getViewUrl)(img.key);
        return {
            ...img.toObject(),
            url: viewUrl, // Direct AWS Presigned URL for visibility
            baseUrl: (0, s3_1.getS3Url)(img.key) // Direct AWS Base URL for copying
        };
    }));
    res.status(200).json({
        success: true,
        data: imagesWithUrls,
    });
});
/**
 * @desc    Short URL Proxy - Redirects to a fresh presigned URL
 * @route   GET /api/upload/raw/:id
 * @access  Public (for image embedding)
 */
exports.proxyImage = (0, express_async_handler_1.default)(async (req, res) => {
    const upload = await Upload_1.default.findById(req.params.id);
    if (!upload) {
        res.status(404).send('Image not found');
        return;
    }
    try {
        const presignedUrl = await (0, s3Service_1.getViewUrl)(upload.key, 3600); // 1 hour token
        res.redirect(presignedUrl);
    }
    catch (error) {
        res.status(500).send('Error generating access token');
    }
});
/**
 * @desc    Delete uploaded image from S3 and DB
 * @route   DELETE /api/upload/:id
 * @access  Private
 */
exports.deleteUpload = (0, express_async_handler_1.default)(async (req, res) => {
    const upload = await Upload_1.default.findById(req.params.id);
    if (!upload) {
        res.status(404).json({
            success: false,
            message: 'Upload not found',
        });
        return;
    }
    // Check ownership
    if (upload.userId.toString() !== req.user?._id?.toString()) {
        res.status(403).json({
            success: false,
            message: 'Not authorized to delete this image',
        });
        return;
    }
    try {
        // Delete from S3
        await (0, s3Service_1.deleteFile)(upload.key);
        // Delete from DB (or soft delete)
        await Upload_1.default.findByIdAndDelete(req.params.id);
        res.status(200).json({
            success: true,
            message: 'Image deleted successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete image',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
/**
 * @desc    Get upload configuration
 * @route   GET /api/upload/config
 * @access  Public
 */
exports.getUploadConfiguration = (0, express_async_handler_1.default)(async (_req, res) => {
    const config = (0, s3Service_1.getUploadConfig)();
    res.status(200).json({
        success: true,
        data: config,
    });
});
/**
 * @desc    Upload and analyze crop image (combines S3 upload + AI analysis)
 * @route   POST /api/upload/analyze
 * @access  Private
 */
exports.uploadAndAnalyze = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.file) {
        res.status(400).json({
            success: false,
            message: 'No image file provided',
        });
        return;
    }
    const { analyzeImageBuffer } = await Promise.resolve().then(() => __importStar(require('../services/aiService')));
    const { buffer, originalname, mimetype, size } = req.file;
    const language = req.body.language || 'English';
    try {
        // Step 1: Upload to S3
        const uploadResult = await (0, s3Service_1.uploadBuffer)(buffer, originalname, mimetype, 'crop-scans', {
            'uploaded-by': req.user?._id?.toString() || 'anonymous',
            'tenant-id': req.tenantId?.toString() || 'default',
            'type': 'ai-analysis',
        });
        // Save to database
        const newUpload = await Upload_1.default.create({
            tenantId: req.tenantId,
            userId: req.user?._id,
            url: uploadResult.url,
            key: uploadResult.key,
            originalName: originalname,
            size: size,
            mimeType: mimetype,
            folder: 'crop-scans',
        });
        // Step 2: Analyze with AI
        const analysisResult = await analyzeImageBuffer(buffer, mimetype, language);
        res.status(201).json({
            success: true,
            message: 'Image uploaded and analyzed successfully',
            data: {
                imageUrl: uploadResult.url,
                imageKey: uploadResult.key,
                analysis: analysisResult,
                uploadId: newUpload._id,
            },
        });
    }
    catch (error) {
        if (error instanceof s3Service_1.S3ServiceError) {
            res.status(error.code === 'FILE_TOO_LARGE' ? 413 : 400).json({
                success: false,
                message: error.message,
                code: error.code,
            });
            return;
        }
        if (error instanceof aiService_1.AIServiceError) {
            res.status(200).json({
                success: true,
                message: 'Image uploaded but AI analysis failed',
                data: {
                    imageUrl: '',
                    analysisError: error.message,
                },
            });
            return;
        }
        throw error;
    }
});
//# sourceMappingURL=uploadController.js.map