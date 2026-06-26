import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const aiSearchCrop: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAllCrops: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getCropById: (req: AuthRequest, res: Response) => Promise<void>;
export declare const searchCrops: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getCropByName: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPestsAndDiseases: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getCropAdvice: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=cropEncyclopediaController.d.ts.map