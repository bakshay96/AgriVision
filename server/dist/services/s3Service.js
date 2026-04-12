"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getViewUrl = exports.getUploadConfig = exports.extractKeyFromUrl = exports.getPresignedUrl = exports.deleteFile = exports.uploadBase64Image = exports.uploadBuffer = exports.S3ServiceError = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const s3_1 = require("../config/s3");
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
class S3ServiceError extends Error {
    constructor(code, message, originalError) {
        super(message);
        this.code = code;
        this.originalError = originalError;
        this.name = 'S3ServiceError';
    }
}
exports.S3ServiceError = S3ServiceError;
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
const generateS3Key = (originalName, folder = 'uploads') => {
    const timestamp = Date.now();
    const uniqueId = (0, uuid_1.v4)().split('-')[0];
    const extension = path_1.default.extname(originalName).toLowerCase() || '.jpg';
    const safeFolder = folder.replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
    return `${safeFolder}/${timestamp}-${uniqueId}${extension}`;
};
// ─────────────────────────────────────────────────────────────────────────────
// Validate file before upload
// ─────────────────────────────────────────────────────────────────────────────
const validateFile = (buffer, mimeType, originalName) => {
    const isVideo = mimeType.startsWith('video/');
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_FILE_SIZE;
    // Check file size
    if (buffer.length > maxSize) {
        throw new S3ServiceError('FILE_TOO_LARGE', `File size exceeds maximum limit of ${maxSize / 1024 / 1024}MB`);
    }
    // Check file type
    if (!ALLOWED_MEDIA_TYPES.includes(mimeType)) {
        throw new S3ServiceError('INVALID_FILE_TYPE', `Invalid file type: ${mimeType}. Allowed types: ${ALLOWED_MEDIA_TYPES.join(', ')}`);
    }
    // Validate file extension matches mime type
    const extension = path_1.default.extname(originalName).toLowerCase();
    const mimeExtensionMap = {
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
const uploadBuffer = async (buffer, originalName, mimeType, folder = 'uploads', metadata) => {
    // Check if S3 is configured
    if (!(0, s3_1.isS3Configured)()) {
        throw new S3ServiceError('S3_NOT_CONFIGURED', 'AWS S3 is not configured. Please check your environment variables.');
    }
    // Validate file
    validateFile(buffer, mimeType, originalName);
    const key = generateS3Key(originalName, folder);
    try {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: s3_1.S3_BUCKET_NAME,
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
        await s3_1.s3Client.send(command);
        const url = (0, s3_1.getS3Url)(key);
        console.log(`[S3Service] ✅ Uploaded: ${key} (${Math.round(buffer.length / 1024)}KB)`);
        return {
            url,
            key,
            bucket: s3_1.S3_BUCKET_NAME,
            originalName,
            size: buffer.length,
            mimeType,
            uploadedAt: new Date(),
        };
    }
    catch (error) {
        console.error('[S3Service] ❌ Upload failed:', error);
        throw new S3ServiceError('UPLOAD_FAILED', 'Failed to upload file to S3', error);
    }
};
exports.uploadBuffer = uploadBuffer;
// ─────────────────────────────────────────────────────────────────────────────
// Upload image from base64 string
// ─────────────────────────────────────────────────────────────────────────────
const uploadBase64Image = async (base64String, folder = 'uploads', metadata) => {
    // Extract mime type and data from base64 string
    const matches = base64String.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        throw new S3ServiceError('INVALID_FILE_TYPE', 'Invalid base64 image format');
    }
    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    // Generate a filename based on mime type
    const extension = mimeType.split('/')[1] || 'jpg';
    const originalName = `image-${Date.now()}.${extension}`;
    return (0, exports.uploadBuffer)(buffer, originalName, mimeType, folder, metadata);
};
exports.uploadBase64Image = uploadBase64Image;
// ─────────────────────────────────────────────────────────────────────────────
// Delete file from S3
// ─────────────────────────────────────────────────────────────────────────────
const deleteFile = async (key) => {
    if (!(0, s3_1.isS3Configured)()) {
        throw new S3ServiceError('S3_NOT_CONFIGURED', 'AWS S3 is not configured');
    }
    try {
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket: s3_1.S3_BUCKET_NAME,
            Key: key,
        });
        await s3_1.s3Client.send(command);
        console.log(`[S3Service] ✅ Deleted: ${key}`);
    }
    catch (error) {
        console.error('[S3Service] ❌ Delete failed:', error);
        throw new S3ServiceError('DELETE_FAILED', 'Failed to delete file from S3', error);
    }
};
exports.deleteFile = deleteFile;
// ─────────────────────────────────────────────────────────────────────────────
// Generate presigned URL for temporary access
// ─────────────────────────────────────────────────────────────────────────────
const getPresignedUrl = async (key, expirationSeconds = 3600) => {
    if (!(0, s3_1.isS3Configured)()) {
        throw new S3ServiceError('S3_NOT_CONFIGURED', 'AWS S3 is not configured');
    }
    try {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: s3_1.S3_BUCKET_NAME,
            Key: key,
        });
        const url = await (0, s3_request_presigner_1.getSignedUrl)(s3_1.s3Client, command, {
            expiresIn: expirationSeconds,
        });
        return url;
    }
    catch (error) {
        console.error('[S3Service] ❌ Presigned URL generation failed:', error);
        throw new S3ServiceError('PRESIGN_FAILED', 'Failed to generate presigned URL', error);
    }
};
exports.getPresignedUrl = getPresignedUrl;
// ─────────────────────────────────────────────────────────────────────────────
// Extract S3 key from full URL
// ─────────────────────────────────────────────────────────────────────────────
const extractKeyFromUrl = (url) => {
    try {
        const urlObj = new URL(url);
        // Remove leading slash
        return urlObj.pathname.substring(1);
    }
    catch {
        return null;
    }
};
exports.extractKeyFromUrl = extractKeyFromUrl;
// ─────────────────────────────────────────────────────────────────────────────
// Get upload configuration for frontend
// ─────────────────────────────────────────────────────────────────────────────
const getUploadConfig = () => ({
    maxFileSize: MAX_FILE_SIZE,
    maxVideoSize: MAX_VIDEO_SIZE,
    allowedTypes: ALLOWED_IMAGE_TYPES,
    allowedMediaTypes: ALLOWED_MEDIA_TYPES,
    isConfigured: (0, s3_1.isS3Configured)(),
    bucket: s3_1.S3_BUCKET_NAME,
    region: process.env.AWS_REGION || 'ap-south-1',
});
exports.getUploadConfig = getUploadConfig;
// ─────────────────────────────────────────────────────────────────────────────
// Generate presigned URL for viewing (for private buckets)
// ─────────────────────────────────────────────────────────────────────────────
const getViewUrl = async (keyOrUrl, expirationSeconds = 7 * 24 * 60 * 60 // 7 days default
) => {
    if (!(0, s3_1.isS3Configured)()) {
        return keyOrUrl; // Return as-is if S3 not configured
    }
    // Extract key if full URL provided
    const key = keyOrUrl.includes('amazonaws.com')
        ? (0, exports.extractKeyFromUrl)(keyOrUrl) || keyOrUrl
        : keyOrUrl;
    try {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: s3_1.S3_BUCKET_NAME,
            Key: key,
        });
        const url = await (0, s3_request_presigner_1.getSignedUrl)(s3_1.s3Client, command, {
            expiresIn: expirationSeconds,
        });
        return url;
    }
    catch (error) {
        console.error('[S3Service] ❌ Presigned URL generation failed:', error);
        // Return original URL as fallback
        return (0, s3_1.getS3Url)(key);
    }
};
exports.getViewUrl = getViewUrl;
//# sourceMappingURL=s3Service.js.map