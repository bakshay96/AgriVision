export type S3ErrorCode = 'S3_NOT_CONFIGURED' | 'UPLOAD_FAILED' | 'DELETE_FAILED' | 'INVALID_FILE_TYPE' | 'FILE_TOO_LARGE' | 'PRESIGN_FAILED';
export declare class S3ServiceError extends Error {
    readonly code: S3ErrorCode;
    readonly originalError?: unknown | undefined;
    constructor(code: S3ErrorCode, message: string, originalError?: unknown | undefined);
}
export interface UploadResult {
    url: string;
    key: string;
    bucket: string;
    originalName: string;
    size: number;
    mimeType: string;
    uploadedAt: Date;
}
export declare const uploadBuffer: (buffer: Buffer, originalName: string, mimeType: string, folder?: string, metadata?: Record<string, string>) => Promise<UploadResult>;
export declare const uploadBase64Image: (base64String: string, folder?: string, metadata?: Record<string, string>) => Promise<UploadResult>;
export declare const deleteFile: (key: string) => Promise<void>;
export declare const getPresignedUrl: (key: string, expirationSeconds?: number) => Promise<string>;
export declare const extractKeyFromUrl: (url: string) => string | null;
export declare const getUploadConfig: () => {
    maxFileSize: number;
    maxVideoSize: number;
    allowedTypes: string[];
    allowedMediaTypes: string[];
    isConfigured: boolean;
    bucket: string;
    region: string;
};
export declare const getViewUrl: (keyOrUrl: string, expirationSeconds?: number) => Promise<string>;
//# sourceMappingURL=s3Service.d.ts.map