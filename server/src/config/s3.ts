import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

// ─────────────────────────────────────────────────────────────────────────────
// AWS S3 Configuration
// ─────────────────────────────────────────────────────────────────────────────

const requiredEnvVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET_NAME', 'AWS_REGION'];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn(`[S3 Config] Missing environment variables: ${missingVars.join(', ')}`);
  console.warn('[S3 Config] S3 uploads will be disabled. Please check your .env file.');
}

export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || '';
export const S3_REGION = process.env.AWS_REGION || 'ap-south-1';

// Validate S3 is properly configured
export const isS3Configured = (): boolean => {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET_NAME &&
    process.env.AWS_REGION
  );
};

// Generate S3 object URL
export const getS3Url = (key: string): string => {
  return `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${key}`;
};
