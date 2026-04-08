import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { AuthRequest } from '../middleware/auth';
import { uploadBuffer, deleteFile, getViewUrl, S3ServiceError, getUploadConfig } from '../services/s3Service';
import { getS3Url } from '../config/s3';
import { AIServiceError } from '../services/aiService';
import Upload from '../models/Upload';

// ─────────────────────────────────────────────────────────────────────────────
// Upload Controller - Handles image uploads to S3 and database tracking
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Upload single image to S3 and save to DB
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

  const { buffer, originalname, mimetype, size } = req.file;
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

    // Save to database
    const newUpload = await Upload.create({
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
    const viewUrl = await getViewUrl(result.key);
    const baseUrl = getS3Url(result.key);

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        ...newUpload.toObject(),
        url: viewUrl,   // Direct AWS URL (presigned) for UI visibility
        baseUrl: baseUrl // Direct AWS Base URL (short) for copying
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
 * @desc    Upload multiple images to S3 and save to DB
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

      // Save to database
      const newUpload = await Upload.create({
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
 * @desc    Get user's uploaded images
 * @route   GET /api/upload/my-images
 * @access  Private
 */
export const getMyImages = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const images = await Upload.find({
    userId: req.user?._id,
    isActive: true
  }).sort({ createdAt: -1 });

  // Map results to include both direct AWS view URLs and short base URLs
  const imagesWithUrls = await Promise.all(
    images.map(async (img) => {
      const viewUrl = await getViewUrl(img.key);
      return {
        ...img.toObject(),
        url: viewUrl,      // Direct AWS Presigned URL for visibility
        baseUrl: getS3Url(img.key) // Direct AWS Base URL for copying
      };
    })
  );

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
export const proxyImage = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const upload = await Upload.findById(req.params.id);

  if (!upload) {
    res.status(404).send('Image not found');
    return;
  }

  try {
    const presignedUrl = await getViewUrl(upload.key, 3600); // 1 hour token
    res.redirect(presignedUrl);
  } catch (error) {
    res.status(500).send('Error generating access token');
  }
});

/**
 * @desc    Delete uploaded image from S3 and DB
 * @route   DELETE /api/upload/:id
 * @access  Private
 */
export const deleteUpload = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const upload = await Upload.findById(req.params.id);

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
    await deleteFile(upload.key);

    // Delete from DB (or soft delete)
    await Upload.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
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
  const { buffer, originalname, mimetype, size } = req.file;
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

    // Save to database
    const newUpload = await Upload.create({
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
