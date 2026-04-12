import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET_NAME, getS3Url, isS3Configured } from '../config/s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// S3 Service Error Types
// ─────────────────────────────────────────────────────────────────────────────

export type S3ErrorCode =
  | 'S3_NOT_CONFIGURED'
  | 'UPLOAD_FAILED'
  | 'DELETE_FAILED'
  | 'INVALID_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'PRESIGN_FAILED';

export class S3ServiceError extends Error {
  constructor(
    public readonly code: S3ErrorCode,
    message: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'S3ServiceError';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Upload Result Interface
// ─────────────────────────────────────────────────────────────────────────────

export interface UploadResult {
  url: string;
  key: string;
  bucket: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Allowed file types and limits
// ─────────────────────────────────────────────────────────────────────────────

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

const ALLOWED_MEDIA_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  'video/mp4',
  'video/webm',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB for videos

// ─────────────────────────────────────────────────────────────────────────────
// Generate unique S3 key for file
// ─────────────────────────────────────────────────────────────────────────────

const generateS3Key = (
  originalName: string,
  folder: string = 'uploads'
): string => {
  const timestamp = Date.now();
  const uniqueId = uuidv4().split('-')[0];
  const extension = path.extname(originalName).toLowerCase() || '.jpg';
  const safeFolder = folder.replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
  return `${safeFolder}/${timestamp}-${uniqueId}${extension}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Validate file before upload
// ─────────────────────────────────────────────────────────────────────────────

const validateFile = (
  buffer: Buffer,
  mimeType: string,
  originalName: string
): void => {
  const isVideo = mimeType.startsWith('video/');
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_FILE_SIZE;
  
  // Check file size
  if (buffer.length > maxSize) {
    throw new S3ServiceError(
      'FILE_TOO_LARGE',
      `File size exceeds maximum limit of ${maxSize / 1024 / 1024}MB`
    );
  }

  // Check file type
  if (!ALLOWED_MEDIA_TYPES.includes(mimeType)) {
    throw new S3ServiceError(
      'INVALID_FILE_TYPE',
      `Invalid file type: ${mimeType}. Allowed types: ${ALLOWED_MEDIA_TYPES.join(', ')}`
    );
  }

  // Validate file extension matches mime type
  const extension = path.extname(originalName).toLowerCase();
  const mimeExtensionMap: Record<string, string[]> = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/jpg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'image/gif': ['.gif'],
    'video/mp4': ['.mp4'],
    'video/webm': ['.webm'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  };

  const validExtensions = mimeExtensionMap[mimeType] || [];
  if (!validExtensions.includes(extension)) {
    console.warn(`[S3Service] Extension mismatch: ${extension} for mime type ${mimeType}`);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Upload file buffer to S3
// ─────────────────────────────────────────────────────────────────────────────

export const uploadBuffer = async (
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder: string = 'uploads',
  metadata?: Record<string, string>
): Promise<UploadResult> => {
  // Check if S3 is configured
  if (!isS3Configured()) {
    throw new S3ServiceError(
      'S3_NOT_CONFIGURED',
      'AWS S3 is not configured. Please check your environment variables.'
    );
  }

  // Validate file
  validateFile(buffer, mimeType, originalName);

  const key = generateS3Key(originalName, folder);

  try {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ACL: "bucket-owner-full-control",
      Metadata: {
        'original-name': encodeURIComponent(originalName),
        'uploaded-at': new Date().toISOString(),
        ...metadata,
      },
    });

    await s3Client.send(command);

    const url = getS3Url(key);

    console.log(`[S3Service] ✅ Uploaded: ${key} (${Math.round(buffer.length / 1024)}KB)`);

    return {
      url,
      key,
      bucket: S3_BUCKET_NAME,
      originalName,
      size: buffer.length,
      mimeType,
      uploadedAt: new Date(),
    };
  } catch (error) {
    console.error('[S3Service] ❌ Upload failed:', error);
    throw new S3ServiceError(
      'UPLOAD_FAILED',
      'Failed to upload file to S3',
      error
    );
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Upload image from base64 string
// ─────────────────────────────────────────────────────────────────────────────

export const uploadBase64Image = async (
  base64String: string,
  folder: string = 'uploads',
  metadata?: Record<string, string>
): Promise<UploadResult> => {
  // Extract mime type and data from base64 string
  const matches = base64String.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);

  if (!matches || matches.length !== 3) {
    throw new S3ServiceError(
      'INVALID_FILE_TYPE',
      'Invalid base64 image format'
    );
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');

  // Generate a filename based on mime type
  const extension = mimeType.split('/')[1] || 'jpg';
  const originalName = `image-${Date.now()}.${extension}`;

  return uploadBuffer(buffer, originalName, mimeType, folder, metadata);
};

// ─────────────────────────────────────────────────────────────────────────────
// Delete file from S3
// ─────────────────────────────────────────────────────────────────────────────

export const deleteFile = async (key: string): Promise<void> => {
  if (!isS3Configured()) {
    throw new S3ServiceError(
      'S3_NOT_CONFIGURED',
      'AWS S3 is not configured'
    );
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    console.log(`[S3Service] ✅ Deleted: ${key}`);
  } catch (error) {
    console.error('[S3Service] ❌ Delete failed:', error);
    throw new S3ServiceError(
      'DELETE_FAILED',
      'Failed to delete file from S3',
      error
    );
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Generate presigned URL for temporary access
// ─────────────────────────────────────────────────────────────────────────────

export const getPresignedUrl = async (
  key: string,
  expirationSeconds: number = 3600
): Promise<string> => {
  if (!isS3Configured()) {
    throw new S3ServiceError(
      'S3_NOT_CONFIGURED',
      'AWS S3 is not configured'
    );
  }

  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: expirationSeconds,
    });

    return url;
  } catch (error) {
    console.error('[S3Service] ❌ Presigned URL generation failed:', error);
    throw new S3ServiceError(
      'PRESIGN_FAILED',
      'Failed to generate presigned URL',
      error
    );
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Extract S3 key from full URL
// ─────────────────────────────────────────────────────────────────────────────

export const extractKeyFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    // Remove leading slash
    return urlObj.pathname.substring(1);
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Get upload configuration for frontend
// ─────────────────────────────────────────────────────────────────────────────

export const getUploadConfig = () => ({
  maxFileSize: MAX_FILE_SIZE,
  maxVideoSize: MAX_VIDEO_SIZE,
  allowedTypes: ALLOWED_IMAGE_TYPES,
  allowedMediaTypes: ALLOWED_MEDIA_TYPES,
  isConfigured: isS3Configured(),
  bucket: S3_BUCKET_NAME,
  region: process.env.AWS_REGION || 'ap-south-1',
});

// ─────────────────────────────────────────────────────────────────────────────
// Generate presigned URL for viewing (for private buckets)
// ─────────────────────────────────────────────────────────────────────────────

export const getViewUrl = async (
  keyOrUrl: string,
  expirationSeconds: number = 7 * 24 * 60 * 60 // 7 days default
): Promise<string> => {
  if (!isS3Configured()) {
    return keyOrUrl; // Return as-is if S3 not configured
  }
  
  // Extract key if full URL provided
  const key = keyOrUrl.includes('amazonaws.com') 
    ? extractKeyFromUrl(keyOrUrl) || keyOrUrl
    : keyOrUrl;
  
  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: expirationSeconds,
    });

    return url;
  } catch (error) {
    console.error('[S3Service] ❌ Presigned URL generation failed:', error);
    // Return original URL as fallback
    return getS3Url(key);
  }
};

