import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

// ─── Custom AppError type ──────────────────────────────────────────────────────────────────
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: number; // MongoDB/Mongoose error code
  keyValue?: Record<string, unknown>; // Mongoose duplicate-key details
}

// ─── Global Error Handler ─────────────────────────────────────────────────────────────────
export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // ─ Mongoose CastError (invalid ObjectId) ─────────────────────────────────────
  if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value "${err.value}" for field "${err.path}"`;
  }

  // ─ Mongoose ValidationError ───────────────────────────────────────────────
  else if (err instanceof mongoose.Error.ValidationError) {
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
  } else if (err.name === 'TokenExpiredError') {
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

// ─── 404 Handler ─────────────────────────────────────────────────────────────────────────
export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
};

// ─── Factory helper ─────────────────────────────────────────────────────────────────────────
export const createError = (message: string, statusCode: number): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

