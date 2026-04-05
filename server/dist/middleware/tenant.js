"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantIsolation = void 0;
/**
 * Tenant isolation middleware.
 * Ensures all queries are scoped to the authenticated user's tenantId.
 * Must be used after the `protect` middleware.
 */
const tenantIsolation = (req, res, next) => {
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
exports.tenantIsolation = tenantIsolation;
//# sourceMappingURL=tenant.js.map