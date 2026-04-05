"use strict";
// ─── Custom Error Classes ─────────────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessLogicError = exports.ServerError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = void 0;
/**
 * Validation Error
 * Used when request data validation fails
 */
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}
exports.ValidationError = ValidationError;
/**
 * Authentication Error
 * Used when user authentication fails
 */
class AuthenticationError extends Error {
    constructor(message = 'Authentication failed') {
        super(message);
        this.name = 'AuthenticationError';
        Object.setPrototypeOf(this, AuthenticationError.prototype);
    }
}
exports.AuthenticationError = AuthenticationError;
/**
 * Authorization Error
 * Used when user doesn't have permission for an action
 */
class AuthorizationError extends Error {
    constructor(message = 'Access denied') {
        super(message);
        this.name = 'AuthorizationError';
        Object.setPrototypeOf(this, AuthorizationError.prototype);
    }
}
exports.AuthorizationError = AuthorizationError;
/**
 * Not Found Error
 * Used when a requested resource doesn't exist
 */
class NotFoundError extends Error {
    constructor(message = 'Resource not found') {
        super(message);
        this.name = 'NotFoundError';
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Conflict Error
 * Used when there's a resource conflict (e.g., duplicate entry)
 */
class ConflictError extends Error {
    constructor(message = 'Resource conflict') {
        super(message);
        this.name = 'ConflictError';
        Object.setPrototypeOf(this, ConflictError.prototype);
    }
}
exports.ConflictError = ConflictError;
/**
 * Server Error
 * Used for unexpected server errors
 */
class ServerError extends Error {
    constructor(message = 'Internal server error') {
        super(message);
        this.name = 'ServerError';
        Object.setPrototypeOf(this, ServerError.prototype);
    }
}
exports.ServerError = ServerError;
/**
 * Business Logic Error
 * Used for application-level business logic violations
 */
class BusinessLogicError extends Error {
    constructor(message = 'Business logic error') {
        super(message);
        this.name = 'BusinessLogicError';
        Object.setPrototypeOf(this, BusinessLogicError.prototype);
    }
}
exports.BusinessLogicError = BusinessLogicError;
//# sourceMappingURL=errors.js.map