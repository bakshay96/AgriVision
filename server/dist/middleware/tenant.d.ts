import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
/**
 * Tenant isolation middleware.
 * Ensures all queries are scoped to the authenticated user's tenantId.
 * Must be used after the `protect` middleware.
 */
export declare const tenantIsolation: (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=tenant.d.ts.map