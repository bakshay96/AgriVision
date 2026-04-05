import { Response } from 'express';
import Crop from '../models/Crop';
import AIAnalysis from '../models/AIAnalysis';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { predictHarvestDate } from '../services/aiService';
import { deleteFile, extractKeyFromUrl, uploadBuffer } from '../services/s3Service';
import { emitCropAlert } from '../services/socketService';

// GET /api/crops
export const getCrops = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, healthScore, page = 1, limit = 20 } = req.query;
  const tenantId = req.tenantId!;

  const filter: Record<string, unknown> = { tenantId, isActive: true };
  if (status) filter.status = status;
  if (healthScore) filter.healthScore = healthScore;

  const skip = (Number(page) - 1) * Number(limit);
  const [crops, total] = await Promise.all([
    Crop.find(filter)
      .populate('farmerId', 'name email farmName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Crop.countDocuments(filter),
  ]);

  // Fetch latest AI analysis for each crop
  const cropsWithAI = await Promise.all(
    crops.map(async (crop) => {
      const latestAnalysis = await AIAnalysis.findOne({
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
    })
  );

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

// GET /api/crops/:id
export const getCropById = async (req: AuthRequest, res: Response): Promise<void> => {
  const crop = await Crop.findOne({ _id: req.params.id, tenantId: req.tenantId, isActive: true })
    .populate('farmerId', 'name email farmName');

  if (!crop) throw createError('Crop not found', 404);

  // Fetch latest AI analyses for this crop
  const aiAnalyses = await AIAnalysis.find({ 
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

// POST /api/crops
export const createCrop = async (req: AuthRequest, res: Response): Promise<void> => {
  const crop = await Crop.create({
    ...req.body,
    tenantId: req.tenantId,
    farmerId: req.user!._id,
  });

  // Trigger harvest date prediction
  try {
    const prediction = await predictHarvestDate({
      cropName: crop.name,
      plantedDate: crop.plantedDate,
      areaAcres: crop.areaAcres,
      soilPh: crop.soilData?.ph,
    });

    crop.predictedHarvestDate = prediction.predictedHarvestDate;
    crop.currentYieldEstimate = prediction.yieldEstimate;
    await crop.save();
  } catch {
    // Non-blocking — prediction is optional
    console.warn('[CropController] Harvest prediction failed, crop saved without prediction.');
  }

  res.status(201).json({ success: true, message: 'Crop created', data: { crop } });
};

// PUT /api/crops/:id
export const updateCrop = async (req: AuthRequest, res: Response): Promise<void> => {
  const crop = await Crop.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!crop) throw createError('Crop not found', 404);

  const previousHealth = crop.healthScore;
  Object.assign(crop, req.body);
  await crop.save();

  // Emit alert if health degraded to critical
  if (previousHealth !== 'critical' && crop.healthScore === 'critical') {
    emitCropAlert(req.tenantId!, {
      cropId: crop._id,
      cropName: crop.name,
      message: `ALERT: ${crop.name} at ${crop.fieldLocation} is in critical health!`,
    });
  }

  res.status(200).json({ success: true, message: 'Crop updated', data: { crop } });
};

// DELETE /api/crops/:id (soft delete + delete S3 images)
export const deleteCrop = async (req: AuthRequest, res: Response): Promise<void> => {
  const crop = await Crop.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!crop) throw createError('Crop not found', 404);

  // ── Delete crop images from S3 ────────────────────────────────────────────
  if (crop.images && crop.images.length > 0) {
    for (const imageUrl of crop.images) {
      if (imageUrl.includes('amazonaws.com')) {
        const key = extractKeyFromUrl(imageUrl);
        if (key) {
          try {
            await deleteFile(key);
            console.log(`[CropController] ✅ S3 image deleted: ${key}`);
          } catch (err) {
            console.error('[CropController] ⚠️ Failed to delete S3 image:', err);
          }
        }
      }
    }
  }

  // ── Delete associated AI analysis images from S3 ──────────────────────────
  const analyses = await AIAnalysis.find({ cropId: crop._id, tenantId: req.tenantId });
  for (const analysis of analyses) {
    if (analysis.imageUrl && analysis.imageUrl.includes('amazonaws.com')) {
      const key = extractKeyFromUrl(analysis.imageUrl);
      if (key) {
        try {
          await deleteFile(key);
          console.log(`[CropController] ✅ S3 analysis image deleted: ${key}`);
        } catch (err) {
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

// POST /api/crops/:id/images — Upload crop image to S3
export const uploadCropImage = async (req: AuthRequest, res: Response): Promise<void> => {
  const file = (req as AuthRequest & { file?: Express.Multer.File }).file;
  if (!file) throw createError('No image file uploaded', 400);

  const crop = await Crop.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!crop) throw createError('Crop not found', 404);

  // Upload to S3
  const uploadResult = await uploadBuffer(
    file.buffer,
    file.originalname,
    file.mimetype,
    'crop-images',
    {
      'crop-id': crop._id.toString(),
      'farmer-id': req.user!._id.toString(),
      'tenant-id': req.tenantId!,
    }
  );

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

// GET /api/crops/stats/summary
export const getCropStats = async (req: AuthRequest, res: Response): Promise<void> => {
  const tenantId = req.tenantId!;
  const farmerId = req.user!._id;

  const [statusStats, healthStats, aiStatusStats, recentAlerts] = await Promise.all([
    Crop.aggregate([
      { $match: { tenantId, isActive: true } },
      { $group: { _id: '$status', count: { $sum: 1 }, totalArea: { $sum: '$areaAcres' } } },
    ]),
    Crop.aggregate([
      { $match: { tenantId, isActive: true } },
      { $group: { _id: '$healthScore', count: { $sum: 1 } } },
    ]),
    Crop.aggregate([
      { $match: { tenantId, isActive: true } },
      { $group: { _id: '$aiStatus', count: { $sum: 1 }, lastScanned: { $max: '$lastScannedAt' } } },
    ]),
    AIAnalysis.aggregate([
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
    totalCrops: statusStats.reduce((sum: number, s: any) => sum + s.count, 0),
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
