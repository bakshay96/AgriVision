/**
 * Validation Error
 * Used when request data validation fails
 */
export declare class ValidationError extends Error {
    constructor(message: string);
}
/**
 * Authentication Error
 * Used when user authentication fails
 */
export declare class AuthenticationError extends Error {
    constructor(message?: string);
}
/**
 * Authorization Error
 * Used when user doesn't have permission for an action
 */
export declare class AuthorizationError extends Error {
    constructor(message?: string);
}
/**
 * Not Found Error
 * Used when a requested resource doesn't exist
 */
export declare class NotFoundError extends Error {
    constructor(message?: string);
}
/**
 * Conflict Error
 * Used when there's a resource conflict (e.g., duplicate entry)
 */
export declare class ConflictError extends Error {
    constructor(message?: string);
}
/**
 * Server Error
 * Used for unexpected server errors
 */
export declare class ServerError extends Error {
    constructor(message?: string);
}
/**
 * Business Logic Error
 * Used for application-level business logic violations
 */
export declare class BusinessLogicError extends Error {
    constructor(message?: string);
}
//# sourceMappingURL=errors.d.ts.map