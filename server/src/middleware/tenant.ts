import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

/**
 * Tenant isolation middleware.
 * Ensures all queries are scoped to the authenticated user's tenantId.
 * Must be used after the `protect` middleware.
 */
export const tenantIsolation = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || !req.tenantId) {
    res.status(401).json({
      success: false,
      message: 'Tenant context not established. Authenticate first.',
    });
    return;
  }
  // Attach tenantId from JWT — prevents users from spoofing other tenants
  req.tenantId = req.user.tenantId;
  next();
};
