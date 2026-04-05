import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import AIAnalysis from '../models/AIAnalysis';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import {
  analyzeImageBuffer,
  analyzeImageWithGemini,
  AIServiceError,
  mapSeverityToAIStatus,
} from '../services/aiService';
import { uploadBuffer, deleteFile, extractKeyFromUrl, getPresignedUrl } from '../services/s3Service';
import { emitAIAnalysisComplete } from '../services/socketService';

// ─────────────────────────────────────────────────────────────────────────────
// Helper — maps AIServiceError codes to HTTP status codes
// ─────────────────────────────────────────────────────────────────────────────
const aiErrorToHttp = (code: AIServiceError['code']): number => {
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
export const scanCrop = async (req: AuthRequest, res: Response): Promise<void> => {
  const file = (req as AuthRequest & { file?: Express.Multer.File }).file;

  if (!file) throw createError('No image file uploaded. Include an "image" field.', 400);

  // Extra server-side size guard (multer already limits but belt-and-suspenders)
  if (file.size > 5 * 1024 * 1024) {
    if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    throw createError('Image exceeds 5 MB limit', 413);
  }

  const userId = req.user!._id.toString();
  const tenantId = req.tenantId!;
  const { cropId, language = 'English' } = req.body;

  try {
    const buffer = fs.readFileSync(file.path);
    
    // ── Call AI service FIRST with the in-memory buffer ─────────────────────
    const result = await analyzeImageBuffer(buffer, file.mimetype, language);
    
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

      const uploadResult = await uploadBuffer(
        buffer,
        file.originalname,
        file.mimetype,
        'crop-scans',
        {
          'uploaded-by': req.user!._id.toString(),
          'tenant-id': tenantId,
          'type': 'ai-analysis',
          'plant-name': result.plantName,
          'condition': result.condition,
        }
      );
      
      s3Url = uploadResult.url;
      uploadSuccess = true;
      
      console.log('[AIController] ✅ Image uploaded to S3 successfully:', {
        url: s3Url,
        key: uploadResult.key,
        bucket: uploadResult.bucket,
        size: uploadResult.size,

      }, "uploaded result",uploadResult);
    } catch (uploadErr) {
      uploadSuccess = false;
      s3Url = ''; // No fallback to local storage
      console.error('[AIController] ⚠️ S3 upload failed, image will not be stored:', {
        error: uploadErr instanceof Error ? uploadErr.message : 'Unknown error',
        originalFilename: file.originalname
      });
    }

    // ── Persist the result with S3 URL ──────────────────────────────────────
    const analysis = await AIAnalysis.create({
      tenantId,
      farmerId:     req.user!._id,
      cropId:       cropId || undefined,
      imageUrl:     s3Url,
      imageName:    file.originalname,
      analysisType: 'disease_detection',
      diagnosis: {
        plantName:   result.plantName,
        disease:     result.condition,
        confidence:  result.confidenceScore,
        severity:    result.severity,
        affectedArea:result.affectedArea,
        description: result.description,
        symptoms:    result.symptoms,
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
        preventionTips: ['Monitor weekly', 'Maintain good drainage', 'Rotate crops annually'],
        estimatedRecoveryDays: result.severity === 'healthy' ? 0 : 14,
      },
      aiModel:          result.aiModel,
      processingTimeMs: result.processingTimeMs,
    });

    // ── Real-time notification via Socket.io ─────────────────────────────────
    emitAIAnalysisComplete(userId, {
      analysisId: analysis._id,
      disease:    result.condition,
      severity:   result.severity,
      confidence: result.confidenceScore,
    });

    // ── Optionally update crop AI status ────────────────────────────────────
    if (cropId) {
      const Crop = (await import('../models/Crop')).default;
      await Crop.findOneAndUpdate(
        { _id: cropId, tenantId },
        {
          aiStatus:          mapSeverityToAIStatus(result.severity),
          aiStatusUpdatedAt: new Date(),
          lastScannedAt:     new Date(),
        }
      );
    }

    // Generate signed URL for immediate preview
    let signedUrl = '';
    if (s3Url && s3Url.includes('amazonaws.com')) {
      const key = extractKeyFromUrl(s3Url);
      if (key) {
        try {
          signedUrl = await getPresignedUrl(key, 3600);
        } catch (signErr) {
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
  } catch (err) {
    if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    // Re-map AIServiceError to user-friendly HTTP error
    if (err instanceof AIServiceError) {
      const status = aiErrorToHttp(err.code);
      const userMsg =
        err.code === 'INVALID_KEY' ? 'AI service is temporarily unavailable. Please try again later.' :
          err.code === 'RATE_LIMITED' ? 'AI service is busy. Please wait a moment and retry.' :
            err.code === 'INVALID_IMAGE' ? 'The uploaded image could not be processed. Try a clearer photo.' :
              err.code === 'MODEL_NOT_FOUND' ? `AI model error: ${err.message}. Please contact support.` :
                err.code === 'PARSE_ERROR' ? 'AI response was invalid or contained unexpected translations. Please try scanning again.' :
                  err.code === 'API_UNAVAILABLE' ? 'AI service is temporarily down. Please try again later.' :
                    'AI analysis failed. Please try again.';
      throw createError(userMsg, status);
    }
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/analyze — LEGACY endpoint (disk-storage, backward compat)
// ─────────────────────────────────────────────────────────────────────────────
export const analyzeImage = async (req: AuthRequest, res: Response): Promise<void> => {
  const file = (req as AuthRequest & { file?: Express.Multer.File }).file;
  if (!file) throw createError('No image uploaded', 400);

  const { cropId } = req.body;
  const userId     = req.user!._id.toString();

  try {
    const result = await analyzeImageWithGemini(file.path, file.mimetype);

    const analysis = await AIAnalysis.create({
      tenantId:     req.tenantId,
      farmerId:     req.user!._id,
      cropId:       cropId || undefined,
      imageUrl:     `/uploads/${file.filename}`,
      imageName:    file.originalname,
      analysisType: 'disease_detection',
      diagnosis: {
        disease:     result.disease,
        confidence:  result.confidence,
        severity:    result.severity,
        affectedArea:result.affectedArea,
        description: result.description,
        symptoms:    result.symptoms,
      },
      treatmentPlan:    result.treatmentPlan,
      aiModel:          result.aiModel,
      processingTimeMs: result.processingTimeMs,
    });

    emitAIAnalysisComplete(userId, {
      analysisId: analysis._id,
      disease:    result.disease,
      severity:   result.severity,
      confidence: result.confidence,
    });

    res.status(201).json({
      success: true,
      message: 'AI analysis complete',
      data: { analysis },
    });
  } catch (err) {
    // Clean up uploaded file on any error
    if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/analyses
// ─────────────────────────────────────────────────────────────────────────────
export const getAnalyses = async (req: AuthRequest, res: Response): Promise<void> => {
  const { severity, page = 1, limit = 20 } = req.query;
  const tenantId = req.tenantId!;

  const filter: Record<string, unknown> = {
    tenantId,
    farmerId:   req.user!._id,
    isArchived: false,
  };
  if (severity) filter['diagnosis.severity'] = severity;

  const skip = (Number(page) - 1) * Number(limit);
  const [analysesDocs, total] = await Promise.all([
    AIAnalysis.find(filter)
      .populate('cropId', 'name variety fieldLocation')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    AIAnalysis.countDocuments(filter),
  ]);

  // Generate presigned URLs for S3 images to fix AccessDenied
  const analyses = await Promise.all(analysesDocs.map(async (doc) => {
    const analysis = doc.toObject();
    if (analysis.imageUrl && analysis.imageUrl.includes('amazonaws.com')) {
      const key = extractKeyFromUrl(analysis.imageUrl);
      if (key) {
        try {
          analysis.imageUrl = await getPresignedUrl(key, 3600); // 1 hour expiry
        } catch (err) {
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

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/analyses/:id
// ─────────────────────────────────────────────────────────────────────────────
export const getAnalysisById = async (req: AuthRequest, res: Response): Promise<void> => {
  const analysisDoc = await AIAnalysis.findOne({
    _id:        req.params.id,
    tenantId:   req.tenantId,
    isArchived: false,
  }).populate('cropId', 'name variety fieldLocation');

  if (!analysisDoc) throw createError('Analysis not found', 404);
  
  const analysis = analysisDoc.toObject();
  
  // Sign URL if S3
  if (analysis.imageUrl && analysis.imageUrl.includes('amazonaws.com')) {
    const key = extractKeyFromUrl(analysis.imageUrl);
    if (key) {
      try {
        analysis.imageUrl = await getPresignedUrl(key, 3600);
      } catch (err) {
        console.warn(`[AIController] ⚠️ Failed to sign URL for ${key}:`, err);
      }
    }
  }

  res.status(200).json({ success: true, data: { analysis } });
};


// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/ai/analyses/:id  (soft archive + delete S3 image)
// ─────────────────────────────────────────────────────────────────────────────
export const archiveAnalysis = async (req: AuthRequest, res: Response): Promise<void> => {
  const analysis = await AIAnalysis.findOne({
    _id: req.params.id,
    tenantId: req.tenantId,
    farmerId: req.user!._id,
  });
  
  if (!analysis) throw createError('Analysis not found', 404);

  // ── Delete image from S3 if it's an S3 URL ────────────────────────────────
  if (analysis.imageUrl && analysis.imageUrl.includes('amazonaws.com')) {
    const key = extractKeyFromUrl(analysis.imageUrl);
    if (key) {
      try {
        await deleteFile(key);
        console.log(`[AIController] ✅ S3 image deleted: ${key}`);
      } catch (err) {
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

// Exported for route file (legacy disk upload dir)
export const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
