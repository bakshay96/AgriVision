import { toast } from 'sonner';
import axios from 'axios';

/**
 * Extract meaningful error message from API error response
 * Handles various error formats from backend
 */
export const getErrorMessage = (error: unknown): string => {
  // Axios error with response from backend
  if (axios.isAxiosError(error)) {
    // Backend validation errors (400, 422)
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    // Backend error with details array
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      return error.response.data.errors[0]?.msg || error.response.data.errors[0]?.message || 'Validation failed';
    }
    
    // HTTP status-based messages
    switch (error.response?.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Session expired. Please login again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'Resource not found.';
      case 409:
        return 'Conflict: This resource already exists.';
      case 413:
        return 'File too large. Please upload a smaller file.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
        return 'Service temporarily unavailable. Please try again.';
      case 503:
        return 'Service under maintenance. Please try again later.';
      default:
        return error.response?.data?.message || `Request failed with status ${error.response?.status}`;
    }
  }
  
  // Generic error
  if (error instanceof Error) {
    return error.message;
  }
  
  // Unknown error
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Display error toast with backend message
 * @param error - The error object from API call
 * @param customTitle - Optional custom title (defaults to "Error")
 * @param duration - Toast duration in ms (defaults to 5000)
 */
export const showErrorToast = (
  error: unknown,
  customTitle?: string,
  duration?: number
) => {
  const message = getErrorMessage(error);
  const title = customTitle || 'Error';
  
  console.error(`[${title}]`, error);
  
  toast.error(title, {
    description: message,
    duration: duration || 5000,
  });
};

/**
 * Display success toast
 * @param message - Success message
 * @param description - Optional detailed description
 * @param duration - Toast duration in ms (defaults to 3000)
 */
export const showSuccessToast = (
  message: string,
  description?: string,
  duration?: number
) => {
  toast.success(message, {
    description,
    duration: duration || 3000,
  });
};

/**
 * Display warning toast
 * @param message - Warning message
 * @param description - Optional detailed description
 */
export const showWarningToast = (message: string, description?: string) => {
  toast.warning(message, {
    description,
    duration: 4000,
  });
};

/**
 * Display info toast
 * @param message - Info message
 * @param description - Optional detailed description
 */
export const showInfoToast = (message: string, description?: string) => {
  toast.info(message, {
    description,
    duration: 4000,
  });
};

/**
 * Handle mutation error with toast notification
 * Usage: onError: handleMutationError('Operation Failed')
 */
export const handleMutationError = (customTitle?: string) => (error: unknown) => {
  showErrorToast(error, customTitle);
};

/**
 * Format validation errors from backend into readable string
 * Example: "Email is required, Password must be at least 8 characters"
 */
export const formatValidationErrors = (errors: Array<{ msg?: string; message?: string }>): string => {
  if (!errors || !Array.isArray(errors)) return 'Validation failed';
  
  return errors
    .map(err => err.msg || err.message || 'Invalid field')
    .join(', ');
};
