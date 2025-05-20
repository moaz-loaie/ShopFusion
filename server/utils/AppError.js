/**
 * Custom Error class for handling operational errors.
 * Allows distinguishing between known errors and unexpected bugs.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // Call parent constructor (Error)

    this.statusCode = statusCode;
    // Status reflects statusCode: 4xx = 'fail', 5xx = 'error'
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    // Operational errors are predictable issues (e.g., user input invalid)
    this.isOperational = true;

    // Capture stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
