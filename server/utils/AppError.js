/**
 * Custom Error class for operational errors (predictable errors vs. bugs).
 * Ensures errors have a statusCode, status, and isOperational flag.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // Pass message to parent Error constructor

    this.statusCode = statusCode || 500; // Default to 500 if not provided
    // Status reflects statusCode: 4xx = 'fail', 5xx = 'error'
    this.status = `${this.statusCode}`.startsWith("4") ? "fail" : "error";
    // Mark as an operational error (expected, like user input error) by default if status code < 500
    this.isOperational = this.statusCode < 500;

    // Capture stack trace, omitting constructor call
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
