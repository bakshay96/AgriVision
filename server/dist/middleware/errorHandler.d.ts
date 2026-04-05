import { Request, Response, NextFunction } from 'express';
export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
    code?: number;
    keyValue?: Record<string, unknown>;
}
export declare const errorHandler: (err: AppError, _req: Request, res: Response, _next: NextFunction) => void;
export declare const notFound: (req: Request, res: Response) => void;
export declare const createError: (message: string, statusCode: number) => AppError;
//# sourceMappingURL=errorHandler.d.ts.map