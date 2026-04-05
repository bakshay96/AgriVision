"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getS3Url = exports.isS3Configured = exports.S3_REGION = exports.S3_BUCKET_NAME = exports.s3Client = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// ─────────────────────────────────────────────────────────────────────────────
// AWS S3 Configuration
// ─────────────────────────────────────────────────────────────────────────────
const requiredEnvVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET_NAME', 'AWS_REGION'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    console.warn(`[S3 Config] Missing environment variables: ${missingVars.join(', ')}`);
    console.warn('[S3 Config] S3 uploads will be disabled. Please check your .env file.');
}
exports.s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});
exports.S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || '';
exports.S3_REGION = process.env.AWS_REGION || 'ap-south-1';
// Validate S3 is properly configured
const isS3Configured = () => {
    return !!(process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_SECRET_ACCESS_KEY &&
        process.env.AWS_S3_BUCKET_NAME &&
        process.env.AWS_REGION);
};
exports.isS3Configured = isS3Configured;
// Generate S3 object URL
const getS3Url = (key) => {
    return `https://${exports.S3_BUCKET_NAME}.s3.${exports.S3_REGION}.amazonaws.com/${key}`;
};
exports.getS3Url = getS3Url;
//# sourceMappingURL=s3.js.map