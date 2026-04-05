import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { AuthRequest } from '../middleware/auth';
import { uploadBuffer, S3ServiceError, getUploadConfig } from '../services/s3Service';
import { AIServiceError } from '../services/aiService';

// ─────────────────────────────────────────────────────────────────────────────
// Upload Controller - Handles image uploads to S3
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Upload single image to S3
 * @route   POST /api/upload/image
 * @access  Private
 */
export const uploadImage = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      message: 'No image file provided',
    });
    return;
  }

  const { buffer, originalname, mimetype } = req.file;
  const folder = req.body.folder || 'uploads';

  try {
    const result = await uploadBuffer(
      buffer,
      originalname,
      mimetype,
      folder,
      {
        'uploaded-by': req.user?._id?.toString() || 'anonymous',
        'tenant-id': req.tenantId?.toString() || 'default',
      }
    );

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: result.url,
        key: result.key,
        size: result.size,
        mimeType: result.mimeType,
        uploadedAt: result.uploadedAt,
      },
    });
  } catch (error) {
    if (error instanceof S3ServiceError) {
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
 * @desc    Upload multiple images to S3
 * @route   POST /api/upload/images
 * @access  Private
 */
export const uploadMultipleImages = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    res.status(400).json({
      success: false,
      message: 'No image files provided',
    });
    return;
  }

  const folder = req.body.folder || 'uploads';
  const files = req.files as Express.Multer.File[];

  const uploadPromises = files.map(async (file) => {
    try {
      const result = await uploadBuffer(
        file.buffer,
        file.originalname,
        file.mimetype,
        folder,
        {
          'uploaded-by': req.user?._id?.toString() || 'anonymous',
          'tenant-id': req.tenantId?.toString() || 'default',
        }
      );
      return {
        success: true,
        url: result.url,
        key: result.key,
        originalName: result.originalName,
        size: result.size,
      };
    } catch (error) {
      return {
        success: false,
        originalName: file.originalname,
        error: error instanceof S3ServiceError ? error.message : 'Upload failed',
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
 * @desc    Get upload configuration
 * @route   GET /api/upload/config
 * @access  Public
 */
export const getUploadConfiguration = asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
  const config = getUploadConfig();

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
export const uploadAndAnalyze = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      message: 'No image file provided',
    });
    return;
  }

  const { analyzeImageBuffer } = await import('../services/aiService');
  const { buffer, originalname, mimetype } = req.file;
  const language = req.body.language || 'English';

  try {
    // Step 1: Upload to S3
    const uploadResult = await uploadBuffer(
      buffer,
      originalname,
      mimetype,
      'crop-scans',
      {
        'uploaded-by': req.user?._id?.toString() || 'anonymous',
        'tenant-id': req.tenantId?.toString() || 'default',
        'type': 'ai-analysis',
      }
    );

    // Step 2: Analyze with AI
    const analysisResult = await analyzeImageBuffer(buffer, mimetype, language);

    res.status(201).json({
      success: true,
      message: 'Image uploaded and analyzed successfully',
      data: {
        imageUrl: uploadResult.url,
        imageKey: uploadResult.key,
        analysis: analysisResult,
      },
    });
  } catch (error) {
    if (error instanceof S3ServiceError) {
      res.status(error.code === 'FILE_TOO_LARGE' ? 413 : 400).json({
        success: false,
        message: error.message,
        code: error.code,
      });
      return;
    }

    if (error instanceof AIServiceError) {
      // If AI fails but upload succeeded, return the image URL
      res.status(200).json({
        success: true,
        message: 'Image uploaded but AI analysis failed',
        data: {
          imageUrl: '', // Will be populated if we want to return partial success
          analysisError: error.message,
        },
      });
      return;
    }

    throw error;
  }
});
