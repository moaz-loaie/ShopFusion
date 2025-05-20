const AppError = require("../utils/AppError");

// Basic error handling structure
// TODO: Add more specific error handling based on error types (Sequelize validation, etc.)
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500; // Default to 500 Internal Server Error
  err.status = err.status || "error";

  console.error("ERROR 💥", err); // Log the full error for debugging

  // Handle specific known errors (e.g., from AppError)
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  // Handle Sequelize validation errors
  else if (err.name === "SequelizeValidationError") {
    const messages = err.errors.map((el) => el.message);
    const message = `Invalid input data. ${messages.join(". ")}`;
    const error = new AppError(message, 400); // Bad Request
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
      errors: err.errors, // Optionally send specific field errors
    });
  }
  // Handle Sequelize unique constraint errors
  else if (err.name === "SequelizeUniqueConstraintError") {
    const field = Object.keys(err.fields)[0];
    const value = err.fields[field];
    const message = `Duplicate field value: ${value}. Please use another value for ${field}!`;
    const error = new AppError(message, 400); // Bad Request
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  }
  // Handle JWT errors
  else if (err.name === "JsonWebTokenError") {
    const error = new AppError("Invalid token. Please log in again.", 401); // Unauthorized
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  } else if (err.name === "TokenExpiredError") {
    const error = new AppError(
      "Your token has expired. Please log in again.",
      401
    ); // Unauthorized
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  }
  // Handle Programming or other unknown errors: don't leak error details
  else {
    // Send generic message to the client
    res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
      // Optionally include error stack in development
      // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

module.exports = globalErrorHandler;
