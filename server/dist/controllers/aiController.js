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
exports.uploadsDir = exports.archiveAnalysis = exports.getAnalysisById = exports.getAnalyses = exports.analyzeImage = exports.scanCrop = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const AIAnalysis_1 = __importDefault(require("../models/AIAnalysis"));
const errorHandler_1 = require("../middleware/errorHandler");
const aiService_1 = require("../services/aiService");
const s3Service_1 = require("../services/s3Service");
const socketService_1 = require("../services/socketService");
// ─────────────────────────────────────────────────────────────────────────────
// Helper — maps AIServiceError codes to HTTP status codes
// ─────────────────────────────────────────────────────────────────────────────
const aiErrorToHttp = (code) => {
    switch (code) {
        case 'INVALID_KEY': return 500; // misconfiguration — hide from client
        case 'RATE_LIMITED': return 429;
        case 'INVALID_IMAGE': return 422;
        case 'PARSE_ERROR': return 502; // upstream returned bad data
        case 'MODEL_NOT_FOUND': return 503;
        case 'API_UNAVAILABLE': return 503;
        default: return 500;
    }
};
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/scan  — PRIMARY endpoint (memory-storage, no disk I/O)
// Uses the buffered approach: image never touches the filesystem.
// ─────────────────────────────────────────────────────────────────────────────
const scanCrop = async (req, res) => {
    const file = req.file;
    if (!file)
        throw (0, errorHandler_1.createError)('No image file uploaded. Include an "image" field.', 400);
    // Extra server-side size guard (multer already limits but belt-and-suspenders)
    if (file.size > 5 * 1024 * 1024) {
        throw (0, errorHandler_1.createError)('Image exceeds 5 MB limit', 413);
    }
    const userId = req.user._id.toString();
    const tenantId = req.tenantId;
    const { cropId, language = 'English', cropName, cropAge, description } = req.body;
    try {
        // With memoryUpload, the image is in file.buffer (no disk path)
        const buffer = file.buffer;
        if (!buffer || buffer.length === 0) {
            throw (0, errorHandler_1.createError)('Image buffer is empty. Please try uploading again.', 400);
        }
        // ── Call AI service FIRST with the in-memory buffer ─────────────────────
        const result = await (0, aiService_1.analyzeImageBuffer)(buffer, file.mimetype, language, {
            cropName,
            cropAge,
            description
        });
        // ── Only upload to S3 if AI analysis was successful ─────────────────────
        let s3Url = '';
        let uploadSuccess = false;
        try {
            console.log('[AIController] 📤 Starting S3 upload...', {
                filename: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                folder: 'crop-scans'
            });
            // S3 metadata headers only accept ASCII printable characters (RFC 7230).
            // AI responses in Marathi/Hindi contain non-ASCII chars that would cause
            // ERR_INVALID_CHAR. Strip them, falling back to 'Unknown' if nothing remains.
            const toAsciiMeta = (value) => value.replace(/[^\x20-\x7E]/g, '').trim() || 'Unknown';
            const uploadResult = await (0, s3Service_1.uploadBuffer)(buffer, file.originalname, file.mimetype, 'crop-scans', {
                'uploaded-by': req.user._id.toString(),
                'tenant-id': tenantId,
                'type': 'ai-analysis',
                'plant-name': toAsciiMeta(result.plantName),
                'condition': toAsciiMeta(result.condition),
            });
            s3Url = uploadResult.url;
            uploadSuccess = true;
            console.log('[AIController] ✅ Image uploaded to S3 successfully:', {
                url: s3Url,
                key: uploadResult.key,
                bucket: uploadResult.bucket,
                size: uploadResult.size,
            }, "uploaded result", uploadResult);
        }
        catch (uploadErr) {
            uploadSuccess = false;
            s3Url = ''; // No fallback to local storage
            console.error('[AIController] ⚠️ S3 upload failed, image will not be stored:', {
                error: uploadErr instanceof Error ? uploadErr.message : 'Unknown error',
                originalFilename: file.originalname
            });
        }
        // ── Persist the result with S3 URL ──────────────────────────────────────
        const analysis = await AIAnalysis_1.default.create({
            tenantId,
            farmerId: req.user._id,
            cropId: cropId || undefined,
            imageUrl: s3Url,
            imageName: file.originalname,
            analysisType: 'disease_detection',
            diagnosis: {
                plantName: result.plantName,
                disease: result.condition,
                recommendedTreatment: result.recommendedTreatment,
                confidence: result.confidenceScore,
                severity: result.severity,
                affectedArea: result.affectedArea,
                description: result.description,
                symptoms: result.symptoms,
            },
            treatmentPlan: {
                urgency: result.severity === 'critical' || result.severity === 'severe'
                    ? 'immediate'
                    : result.severity === 'healthy'
                        ? 'routine'
                        : 'within_week',
                steps: [
                    { step: 1, action: result.recommendedTreatment, timing: 'As soon as possible', product: undefined },
                ],
                organicRemedies: result.organicRemedies,
                chemicalTreatments: result.chemicalTreatments,
                sprayInstructions: result.sprayInstructions,
                requiredNutrients: result.requiredNutrients,
                preventionTips: result.preventionTips,
                estimatedRecoveryDays: result.estimatedRecoveryDays,
            },
            aiModel: result.aiModel,
            processingTimeMs: result.processingTimeMs,
        });
        // ── Real-time notification via Socket.io ─────────────────────────────────
        (0, socketService_1.emitAIAnalysisComplete)(userId, {
            analysisId: analysis._id,
            disease: result.condition,
            severity: result.severity,
            confidence: result.confidenceScore,
        });
        // ── Optionally update crop AI status ────────────────────────────────────
        if (cropId) {
            const Crop = (await Promise.resolve().then(() => __importStar(require('../models/Crop')))).default;
            await Crop.findOneAndUpdate({ _id: cropId, tenantId }, {
                aiStatus: (0, aiService_1.mapSeverityToAIStatus)(result.severity),
                aiStatusUpdatedAt: new Date(),
                lastScannedAt: new Date(),
            });
        }
        // Generate signed URL for immediate preview
        let signedUrl = '';
        if (s3Url && s3Url.includes('amazonaws.com')) {
            const key = (0, s3Service_1.extractKeyFromUrl)(s3Url);
            if (key) {
                try {
                    signedUrl = await (0, s3Service_1.getPresignedUrl)(decodeURIComponent(key), 3600);
                }
                catch (signErr) {
                    console.warn(`[AIController] ⚠️ Post-scan sign failed for ${key}:`, signErr);
                }
            }
        }
        res.status(201).json({
            success: true,
            message: 'AI scan complete',
            data: {
                // Return both the flat scan result and the persisted analysis doc
                scan: {
                    plantName: result.plantName,
                    condition: result.condition,
                    confidenceScore: result.confidenceScore,
                    severity: result.severity,
                    symptoms: result.symptoms,
                    recommendedTreatment: result.recommendedTreatment,
                    organicRemedies: result.organicRemedies,
                    chemicalTreatments: result.chemicalTreatments,
                    sprayInstructions: result.sprayInstructions,
                    requiredNutrients: result.requiredNutrients,
                    preventionTips: result.preventionTips,
                    estimatedRecoveryDays: result.estimatedRecoveryDays,
                    affectedArea: result.affectedArea,
                    description: result.description,
                    aiModel: result.aiModel,
                    processingTimeMs: result.processingTimeMs,
                    imageUrl: signedUrl || s3Url,
                    uploadSuccess,
                },
                analysisId: analysis._id,
            },
        });
    }
    catch (err) {
        // No disk file to clean up — memory storage handles GC automatically
        // Re-map AIServiceError to user-friendly HTTP error
        if (err instanceof aiService_1.AIServiceError) {
            const status = aiErrorToHttp(err.code);
            const userMsg = err.code === 'INVALID_KEY' ? 'AI service is temporarily unavailable. Please try again later.' :
                err.code === 'RATE_LIMITED' ? 'AI service is busy. Please wait a moment and retry.' :
                    err.code === 'INVALID_IMAGE' ? 'The uploaded image could not be processed. Try a clearer photo.' :
                        err.code === 'MODEL_NOT_FOUND' ? `AI model error: ${err.message}. Please contact support.` :
                            err.code === 'PARSE_ERROR' ? 'AI response was invalid or contained unexpected translations. Please try scanning again.' :
                                err.code === 'API_UNAVAILABLE' ? 'AI service is temporarily down. Please try again later.' :
                                    'AI analysis failed. Please try again.';
            throw (0, errorHandler_1.createError)(userMsg, status);
        }
        throw err;
    }
};
exports.scanCrop = scanCrop;
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/analyze — LEGACY endpoint (disk-storage, backward compat)
// ─────────────────────────────────────────────────────────────────────────────
const analyzeImage = async (req, res) => {
    const file = req.file;
    if (!file)
        throw (0, errorHandler_1.createError)('No image uploaded', 400);
    const { cropId } = req.body;
    const userId = req.user._id.toString();
    try {
        const result = await (0, aiService_1.analyzeImageWithGemini)(file.path, file.mimetype);
        const analysis = await AIAnalysis_1.default.create({
            tenantId: req.tenantId,
            farmerId: req.user._id,
            cropId: cropId || undefined,
            imageUrl: `/uploads/${file.filename}`,
            imageName: file.originalname,
            analysisType: 'disease_detection',
            diagnosis: {
                disease: result.disease,
                confidence: result.confidence,
                severity: result.severity,
                affectedArea: result.affectedArea,
                description: result.description,
                symptoms: result.symptoms,
            },
            treatmentPlan: result.treatmentPlan,
            aiModel: result.aiModel,
            processingTimeMs: result.processingTimeMs,
        });
        (0, socketService_1.emitAIAnalysisComplete)(userId, {
            analysisId: analysis._id,
            disease: result.disease,
            severity: result.severity,
            confidence: result.confidence,
        });
        res.status(201).json({
            success: true,
            message: 'AI analysis complete',
            data: { analysis },
        });
    }
    catch (err) {
        // Clean up uploaded file on any error
        if (file?.path && fs_1.default.existsSync(file.path))
            fs_1.default.unlinkSync(file.path);
        throw err;
    }
};
exports.analyzeImage = analyzeImage;
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/analyses
// ─────────────────────────────────────────────────────────────────────────────
const getAnalyses = async (req, res) => {
    const { severity, page = 1, limit = 20 } = req.query;
    const tenantId = req.tenantId;
    const filter = {
        tenantId,
        farmerId: req.user._id,
        isArchived: false,
    };
    if (severity)
        filter['diagnosis.severity'] = severity;
    const skip = (Number(page) - 1) * Number(limit);
    const [analysesDocs, total] = await Promise.all([
        AIAnalysis_1.default.find(filter)
            .populate('cropId', 'name variety fieldLocation')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        AIAnalysis_1.default.countDocuments(filter),
    ]);
    // Generate presigned URLs for S3 images to fix AccessDenied
    const analyses = await Promise.all(analysesDocs.map(async (doc) => {
        const analysis = doc.toObject();
        if (analysis.imageUrl && analysis.imageUrl.includes('amazonaws.com')) {
            const key = (0, s3Service_1.extractKeyFromUrl)(analysis.imageUrl);
            if (key) {
                try {
                    analysis.imageUrl = await (0, s3Service_1.getPresignedUrl)(decodeURIComponent(key), 3600); // 1 hour expiry
                }
                catch (err) {
                    console.warn(`[AIController] ⚠️ Failed to sign URL for ${key}:`, err);
                }
            }
        }
        return analysis;
    }));
    res.status(200).json({
        success: true,
        data: { analyses, total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
};
exports.getAnalyses = getAnalyses;
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/analyses/:id
// ─────────────────────────────────────────────────────────────────────────────
const getAnalysisById = async (req, res) => {
    const analysisDoc = await AIAnalysis_1.default.findOne({
        _id: req.params.id,
        tenantId: req.tenantId,
        isArchived: false,
    }).populate('cropId', 'name variety fieldLocation');
    if (!analysisDoc)
        throw (0, errorHandler_1.createError)('Analysis not found', 404);
    const analysis = analysisDoc.toObject();
    // Sign URL if S3
    if (analysis.imageUrl && analysis.imageUrl.includes('amazonaws.com')) {
        const key = (0, s3Service_1.extractKeyFromUrl)(analysis.imageUrl);
        if (key) {
            try {
                analysis.imageUrl = await (0, s3Service_1.getPresignedUrl)(decodeURIComponent(key), 3600);
            }
            catch (err) {
                console.warn(`[AIController] ⚠️ Failed to sign URL for ${key}:`, err);
            }
        }
    }
    res.status(200).json({ success: true, data: { analysis } });
};
exports.getAnalysisById = getAnalysisById;
// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/ai/analyses/:id  (soft archive + delete S3 image)
// ─────────────────────────────────────────────────────────────────────────────
const archiveAnalysis = async (req, res) => {
    const analysis = await AIAnalysis_1.default.findOne({
        _id: req.params.id,
        tenantId: req.tenantId,
        farmerId: req.user._id,
    });
    if (!analysis)
        throw (0, errorHandler_1.createError)('Analysis not found', 404);
    // ── Delete image from S3 if it's an S3 URL ────────────────────────────────
    if (analysis.imageUrl && analysis.imageUrl.includes('amazonaws.com')) {
        const key = (0, s3Service_1.extractKeyFromUrl)(analysis.imageUrl);
        if (key) {
            try {
                await (0, s3Service_1.deleteFile)(key);
                console.log(`[AIController] ✅ S3 image deleted: ${key}`);
            }
            catch (err) {
                console.error('[AIController] ⚠️ Failed to delete S3 image:', err);
                // Continue with archiving even if S3 delete fails
            }
        }
    }
    // ── Soft archive the analysis ────────────────────────────────────────────
    analysis.isArchived = true;
    await analysis.save();
    res.status(200).json({ success: true, message: 'Analysis archived and image deleted' });
};
exports.archiveAnalysis = archiveAnalysis;
// Exported for route file (legacy disk upload dir)
exports.uploadsDir = path_1.default.join(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(exports.uploadsDir))
    fs_1.default.mkdirSync(exports.uploadsDir, { recursive: true });
//# sourceMappingURL=aiController.js.map