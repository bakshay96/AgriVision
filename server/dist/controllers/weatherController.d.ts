import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getWeather: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateLocation: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getCropRecommendations: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=weatherController.d.ts.map