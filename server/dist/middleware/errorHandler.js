"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.notFound = exports.errorHandler = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
// ─── Global Error Handler ─────────────────────────────────────────────────────────────────
const errorHandler = (err, _req, res, _next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    // ─ Mongoose CastError (invalid ObjectId) ─────────────────────────────────────
    if (err instanceof mongoose_1.default.Error.CastError) {
        statusCode = 400;
        message = `Invalid value "${err.value}" for field "${err.path}"`;
    }
    // ─ Mongoose ValidationError ───────────────────────────────────────────────
    else if (err instanceof mongoose_1.default.Error.ValidationError) {
        statusCode = 422;
        const errors = Object.values(err.errors).map((e) => e.message);
        message = `Validation failed: ${errors.join('. ')}`;
    }
    // ─ MongoDB Duplicate Key (code 11000) ──────────────────────────────────────
    else if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        message = `Duplicate value for "${field}". Please use a different value.`;
    }
    // ─ JWT Errors ─────────────────────────────────────────────────────────────────────
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token. Please log in again.';
    }
    else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Your session has expired. Please log in again.';
    }
    // ─ Structured log ─────────────────────────────────────────────────────────────────────
    console.error(`[ERROR] ${statusCode} → ${message}`, {
        name: err.name,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
// ─── 404 Handler ─────────────────────────────────────────────────────────────────────────
const notFound = (req, res) => {
    res.status(404).json({
        success: false,
        statusCode: 404,
        message: `Route ${req.method} ${req.originalUrl} not found.`,
    });
};
exports.notFound = notFound;
// ─── Factory helper ─────────────────────────────────────────────────────────────────────────
const createError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};
exports.createError = createError;
//# sourceMappingURL=errorHandler.js.map