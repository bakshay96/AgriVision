import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getCrops: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getCropById: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createCrop: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateCrop: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteCrop: (req: AuthRequest, res: Response) => Promise<void>;
export declare const uploadCropImage: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getCropStats: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=cropController.d.ts.map