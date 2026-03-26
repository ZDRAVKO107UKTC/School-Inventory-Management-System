/**
 * AppError - Standardized application error class
 * All business logic errors should extend or use this class
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
    };
  }
}

module.exports = AppError;
