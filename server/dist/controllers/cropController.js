"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCropStats = exports.uploadCropImage = exports.deleteCrop = exports.updateCrop = exports.createCrop = exports.getCropById = exports.getCrops = void 0;
const Crop_1 = __importDefault(require("../models/Crop"));
const AIAnalysis_1 = __importDefault(require("../models/AIAnalysis"));
const errorHandler_1 = require("../middleware/errorHandler");
const aiService_1 = require("../services/aiService");
const s3Service_1 = require("../services/s3Service");
const socketService_1 = require("../services/socketService");
// GET /api/crops
const getCrops = async (req, res) => {
    const { status, healthScore, page = 1, limit = 20 } = req.query;
    const tenantId = req.tenantId;
    const filter = { tenantId, isActive: true };
    if (status)
        filter.status = status;
    if (healthScore)
        filter.healthScore = healthScore;
    const skip = (Number(page) - 1) * Number(limit);
    const [crops, total] = await Promise.all([
        Crop_1.default.find(filter)
            .populate('farmerId', 'name email farmName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Crop_1.default.countDocuments(filter),
    ]);
    // Fetch latest AI analysis for each crop
    const cropsWithAI = await Promise.all(crops.map(async (crop) => {
        const latestAnalysis = await AIAnalysis_1.default.findOne({
            cropId: crop._id,
            tenantId,
            isArchived: false
        })
            .sort({ createdAt: -1 })
            .select('diagnosis severity confidenceScore createdAt -rawResponse');
        return {
            ...crop.toObject(),
            latestAIAnalysis: latestAnalysis || null
        };
    }));
    console.log('[CropController] 📋 Fetched crops list with AI data:', {
        totalCrops: cropsWithAI.length,
        cropsWithAIStatus: cropsWithAI.filter(c => c.aiStatus !== 'UNKNOWN').length
    });
    res.status(200).json({
        success: true,
        data: {
            crops: cropsWithAI,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit))
        },
    });
};
exports.getCrops = getCrops;
// GET /api/crops/:id
const getCropById = async (req, res) => {
    const crop = await Crop_1.default.findOne({ _id: req.params.id, tenantId: req.tenantId, isActive: true })
        .populate('farmerId', 'name email farmName');
    if (!crop)
        throw (0, errorHandler_1.createError)('Crop not found', 404);
    // Fetch latest AI analyses for this crop
    const aiAnalyses = await AIAnalysis_1.default.find({
        cropId: crop._id,
        tenantId: req.tenantId,
        isArchived: false
    })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('-rawResponse');
    console.log('[CropController] 📊 Fetched crop with AI analyses:', {
        cropId: crop._id,
        cropName: crop.name,
        aiStatus: crop.aiStatus,
        lastScannedAt: crop.lastScannedAt,
        totalAnalyses: aiAnalyses.length
    });
    res.status(200).json({
        success: true,
        data: {
            crop,
            aiAnalyses,
            latestAnalysis: aiAnalyses[0] || null
        }
    });
};
exports.getCropById = getCropById;
// POST /api/crops
const createCrop = async (req, res) => {
    const crop = await Crop_1.default.create({
        ...req.body,
        tenantId: req.tenantId,
        farmerId: req.user._id,
    });
    // Trigger harvest date prediction
    try {
        const prediction = await (0, aiService_1.predictHarvestDate)({
            cropName: crop.name,
            plantedDate: crop.plantedDate,
            areaAcres: crop.areaAcres,
            soilPh: crop.soilData?.ph,
        });
        crop.predictedHarvestDate = prediction.predictedHarvestDate;
        crop.currentYieldEstimate = prediction.yieldEstimate;
        await crop.save();
    }
    catch {
        // Non-blocking — prediction is optional
        console.warn('[CropController] Harvest prediction failed, crop saved without prediction.');
    }
    res.status(201).json({ success: true, message: 'Crop created', data: { crop } });
};
exports.createCrop = createCrop;
// PUT /api/crops/:id
const updateCrop = async (req, res) => {
    const crop = await Crop_1.default.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!crop)
        throw (0, errorHandler_1.createError)('Crop not found', 404);
    const previousHealth = crop.healthScore;
    Object.assign(crop, req.body);
    await crop.save();
    // Emit alert if health degraded to critical
    if (previousHealth !== 'critical' && crop.healthScore === 'critical') {
        (0, socketService_1.emitCropAlert)(req.tenantId, {
            cropId: crop._id,
            cropName: crop.name,
            message: `ALERT: ${crop.name} at ${crop.fieldLocation} is in critical health!`,
        });
    }
    res.status(200).json({ success: true, message: 'Crop updated', data: { crop } });
};
exports.updateCrop = updateCrop;
// DELETE /api/crops/:id (soft delete + delete S3 images)
const deleteCrop = async (req, res) => {
    const crop = await Crop_1.default.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!crop)
        throw (0, errorHandler_1.createError)('Crop not found', 404);
    // ── Delete crop images from S3 ────────────────────────────────────────────
    if (crop.images && crop.images.length > 0) {
        for (const imageUrl of crop.images) {
            if (imageUrl.includes('amazonaws.com')) {
                const key = (0, s3Service_1.extractKeyFromUrl)(imageUrl);
                if (key) {
                    try {
                        await (0, s3Service_1.deleteFile)(key);
                        console.log(`[CropController] ✅ S3 image deleted: ${key}`);
                    }
                    catch (err) {
                        console.error('[CropController] ⚠️ Failed to delete S3 image:', err);
                    }
                }
            }
        }
    }
    // ── Delete associated AI analysis images from S3 ──────────────────────────
    const analyses = await AIAnalysis_1.default.find({ cropId: crop._id, tenantId: req.tenantId });
    for (const analysis of analyses) {
        if (analysis.imageUrl && analysis.imageUrl.includes('amazonaws.com')) {
            const key = (0, s3Service_1.extractKeyFromUrl)(analysis.imageUrl);
            if (key) {
                try {
                    await (0, s3Service_1.deleteFile)(key);
                    console.log(`[CropController] ✅ S3 analysis image deleted: ${key}`);
                }
                catch (err) {
                    console.error('[CropController] ⚠️ Failed to delete S3 analysis image:', err);
                }
            }
        }
        // Archive the analysis
        analysis.isArchived = true;
        await analysis.save();
    }
    // ── Soft delete the crop ─────────────────────────────────────────────────
    crop.isActive = false;
    await crop.save();
    res.status(200).json({ success: true, message: 'Crop and associated images removed' });
};
exports.deleteCrop = deleteCrop;
// POST /api/crops/:id/images — Upload crop image to S3
const uploadCropImage = async (req, res) => {
    const file = req.file;
    if (!file)
        throw (0, errorHandler_1.createError)('No image file uploaded', 400);
    const crop = await Crop_1.default.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!crop)
        throw (0, errorHandler_1.createError)('Crop not found', 404);
    // Upload to S3
    const uploadResult = await (0, s3Service_1.uploadBuffer)(file.buffer, file.originalname, file.mimetype, 'crop-images', {
        'crop-id': crop._id.toString(),
        'farmer-id': req.user._id.toString(),
        'tenant-id': req.tenantId,
    });
    // Add URL to crop images array
    crop.images.push(uploadResult.url);
    await crop.save();
    res.status(201).json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
            url: uploadResult.url,
            key: uploadResult.key,
        },
    });
};
exports.uploadCropImage = uploadCropImage;
// GET /api/crops/stats/summary
const getCropStats = async (req, res) => {
    const tenantId = req.tenantId;
    const farmerId = req.user._id;
    const [statusStats, healthStats, aiStatusStats, recentAlerts] = await Promise.all([
        Crop_1.default.aggregate([
            { $match: { tenantId, isActive: true } },
            { $group: { _id: '$status', count: { $sum: 1 }, totalArea: { $sum: '$areaAcres' } } },
        ]),
        Crop_1.default.aggregate([
            { $match: { tenantId, isActive: true } },
            { $group: { _id: '$healthScore', count: { $sum: 1 } } },
        ]),
        Crop_1.default.aggregate([
            { $match: { tenantId, isActive: true } },
            { $group: { _id: '$aiStatus', count: { $sum: 1 }, lastScanned: { $max: '$lastScannedAt' } } },
        ]),
        AIAnalysis_1.default.aggregate([
            {
                $match: {
                    tenantId,
                    farmerId,
                    isArchived: false,
                    'diagnosis.severity': { $in: ['severe', 'critical'] }
                }
            },
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'crops',
                    localField: 'cropId',
                    foreignField: '_id',
                    as: 'crop'
                }
            },
            { $unwind: { path: '$crop', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    diagnosis: 1,
                    severity: 1,
                    confidence: 1,
                    createdAt: 1,
                    cropName: '$crop.name',
                    cropId: '$crop._id'
                }
            }
        ])
    ]);
    console.log('[CropController] 📈 Dashboard stats fetched:', {
        totalCrops: statusStats.reduce((sum, s) => sum + s.count, 0),
        aiStatusBreakdown: aiStatusStats,
        criticalAlerts: recentAlerts.length
    });
    res.status(200).json({
        success: true,
        data: {
            statusStats,
            healthStats,
            aiStatusStats,
            recentCriticalAlerts: recentAlerts
        },
    });
};
exports.getCropStats = getCropStats;
//# sourceMappingURL=cropController.js.map