import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const scanCrop: (req: AuthRequest, res: Response) => Promise<void>;
export declare const analyzeImage: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAnalyses: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAnalysisById: (req: AuthRequest, res: Response) => Promise<void>;
export declare const archiveAnalysis: (req: AuthRequest, res: Response) => Promise<void>;
export declare const uploadsDir: string;
//# sourceMappingURL=aiController.d.ts.map