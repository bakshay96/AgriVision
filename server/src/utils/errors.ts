// ─── Custom Error Classes ─────────────────────────────────────────────────────

/**
 * Validation Error
 * Used when request data validation fails
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Authentication Error
 * Used when user authentication fails
 */
export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Authorization Error
 * Used when user doesn't have permission for an action
 */
export class AuthorizationError extends Error {
  constructor(message: string = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Not Found Error
 * Used when a requested resource doesn't exist
 */
export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Conflict Error
 * Used when there's a resource conflict (e.g., duplicate entry)
 */
export class ConflictError extends Error {
  constructor(message: string = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Server Error
 * Used for unexpected server errors
 */
export class ServerError extends Error {
  constructor(message: string = 'Internal server error') {
    super(message);
    this.name = 'ServerError';
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Business Logic Error
 * Used for application-level business logic violations
 */
export class BusinessLogicError extends Error {
  constructor(message: string = 'Business logic error') {
    super(message);
    this.name = 'BusinessLogicError';
    Object.setPrototypeOf(this, BusinessLogicError.prototype);
  }
}
