/**
 * @desc    Upload single image to S3
 * @route   POST /api/upload/image
 * @access  Private
 */
export declare const uploadImage: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * @desc    Upload multiple images to S3
 * @route   POST /api/upload/images
 * @access  Private
 */
export declare const uploadMultipleImages: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
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