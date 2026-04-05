import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';
export interface AuthRequest extends Request {
    user?: IUser;
    tenantId?: string;
}
export declare const protect: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const authorize: (...roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map