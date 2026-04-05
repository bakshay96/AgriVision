import { S3Client } from '@aws-sdk/client-s3';
export declare const s3Client: S3Client;
export declare const S3_BUCKET_NAME: string;
export declare const S3_REGION: string;
export declare const isS3Configured: () => boolean;
export declare const getS3Url: (key: string) => string;
//# sourceMappingURL=s3.d.ts.map