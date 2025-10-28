
export interface SecureError {
  userMessage: string;
  errorCode: string;
  timestamp: number;
}

export class ErrorHandler {
  private static readonly ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_001',
    AUTHENTICATION_ERROR: 'AUTH_001',
    AUTHORIZATION_ERROR: 'AUTH_002',
    NETWORK_ERROR: 'NETWORK_001',
    FILE_UPLOAD_ERROR: 'FILE_001',
    UNKNOWN_ERROR: 'UNKNOWN_001'
  };

  // Log errors securely without exposing sensitive information
  static logError(error: any, context: string): void {
    const sanitizedError = {
      message: error?.message || 'Unknown error',
      code: error?.code || 'UNKNOWN',
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // In a real app, this would be sent to a secure logging service
    console.error('[Security Log]', sanitizedError);
  }

  // Create user-safe error messages
  static createSecureError(error: any, context: string): SecureError {
    this.logError(error, context);

    // Map technical errors to user-friendly messages
    let userMessage = 'An unexpected error occurred. Please try again.';
    let errorCode = this.ERROR_CODES.UNKNOWN_ERROR;

    if (error?.name === 'ValidationError' || error?.code?.startsWith('VALIDATION')) {
      userMessage = 'Please check your input and try again.';
      errorCode = this.ERROR_CODES.VALIDATION_ERROR;
    } else if (error?.name === 'NetworkError' || error?.code?.startsWith('NETWORK')) {
      userMessage = 'Network error. Please check your connection and try again.';
      errorCode = this.ERROR_CODES.NETWORK_ERROR;
    } else if (error?.name === 'AuthenticationError') {
      userMessage = 'Authentication failed. Please log in again.';
      errorCode = this.ERROR_CODES.AUTHENTICATION_ERROR;
    } else if (error?.name === 'AuthorizationError') {
      userMessage = 'You do not have permission to perform this action.';
      errorCode = this.ERROR_CODES.AUTHORIZATION_ERROR;
    } else if (context === 'file-upload') {
      userMessage = 'File upload failed. Please check the file and try again.';
      errorCode = this.ERROR_CODES.FILE_UPLOAD_ERROR;
    }

    return {
      userMessage,
      errorCode,
      timestamp: Date.now()
    };
  }

  // Rate limiting for error reporting to prevent spam
  private static errorCounts = new Map<string, { count: number; firstOccurrence: number }>();

  static shouldReportError(errorCode: string): boolean {
    const now = Date.now();
    const existing = this.errorCounts.get(errorCode);

    if (!existing) {
      this.errorCounts.set(errorCode, { count: 1, firstOccurrence: now });
      return true;
    }

    // Reset count if more than 1 hour has passed
    if (now - existing.firstOccurrence > 60 * 60 * 1000) {
      this.errorCounts.set(errorCode, { count: 1, firstOccurrence: now });
      return true;
    }

    // Allow up to 5 reports per hour for the same error
    if (existing.count < 5) {
      existing.count++;
      return true;
    }

    return false;
  }
}
