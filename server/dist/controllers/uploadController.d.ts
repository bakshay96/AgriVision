/**
 * @desc    Upload single image to S3 and save to DB
 * @route   POST /api/upload/image
 * @access  Private
 */
export declare const uploadImage: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * @desc    Upload multiple images to S3 and save to DB
 * @route   POST /api/upload/images
 * @access  Private
 */
export declare const uploadMultipleImages: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * @desc    Get user's uploaded images
 * @route   GET /api/upload/my-images
 * @access  Private
 */
export declare const getMyImages: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * @desc    Short URL Proxy - Redirects to a fresh presigned URL
 * @route   GET /api/upload/raw/:id
 * @access  Public (for image embedding)
 */
export declare const proxyImage: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * @desc    Delete uploaded image from S3 and DB
 * @route   DELETE /api/upload/:id
 * @access  Private
 */
export declare const deleteUpload: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * @desc    Get upload configuration
 * @route   GET /api/upload/config
 * @access  Public
 */
export declare const getUploadConfiguration: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * @desc    Upload and analyze crop image (combines S3 upload + AI analysis)
 * @route   POST /api/upload/analyze
 * @access  Private
 */
export declare const uploadAndAnalyze: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
//# sourceMappingURL=uploadController.d.ts.map