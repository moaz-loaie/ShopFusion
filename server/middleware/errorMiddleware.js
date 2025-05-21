const AppError = require("../utils/AppError");
const logger = require("../utils/logger");

// --- Specific Error Handlers ---
const handleSequelizeValidationError = (err) => {
  const messages = err.errors.map((el) => `${el.path}: ${el.message}`);
  const message = `Invalid input data. ${messages.join(". ")}`;
  logger.warn(`Sequelize Validation Error: ${message}`, { fields: err.fields });
  return new AppError(message, 400);
};

const handleSequelizeUniqueConstraintError = (err) => {
  const field = Object.keys(err.fields)[0] || "field";
  const value = err.value || err.fields[field] || "value";
  const message = `Duplicate value: '${value}' is already taken for ${field}.`;
  logger.warn(`Sequelize Unique Constraint Error: ${message}`);
  return new AppError(message, 409); // 409 Conflict
};

const handleSequelizeForeignKeyConstraintError = (err) => {
  logger.warn("Sequelize Foreign Key Constraint Error:", {
    message: err.message,
    detail: err.parent?.detail,
  });
  const message = `Operation failed due to a data conflict. A related record may not exist or cannot be changed.`;
  return new AppError(message, 409); // Conflict
};

const handleSequelizeDatabaseError = (err) => {
  logger.error("Sequelize Database Error:", {
    message: err.message,
    sql: err.sql,
  });
  const message = "A database error occurred. Please try again later.";
  return new AppError(message, 500);
};

const handleJWTError = () =>
  new AppError("Invalid token. Please log in again.", 401);
const handleJWTExpiredError = () =>
  new AppError("Your token has expired. Please log in again.", 401);

// --- Global Error Handler ---
const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err }; // Clone error to avoid modifying original
  error.statusCode = err.statusCode || 500;
  error.status = err.status || (error.statusCode >= 500 ? "error" : "fail");
  error.message = err.message || "An unexpected error occurred.";
  error.isOperational =
    err.isOperational === undefined
      ? error.statusCode < 500
      : err.isOperational;

  // Development vs Production Handling
  if (process.env.NODE_ENV === "development") {
    // Development: Send detailed error
    logger.error(`Dev Error: ${error.message}`, {
      statusCode: error.statusCode,
      status: error.status,
      stack: err.stack,
      errorObject: err,
    });
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
      error: err, // Send original error details
      stack: err.stack, // Send stack trace
    });
  } else if (process.env.NODE_ENV === "production") {
    // Production: Handle known errors gracefully, hide unknown error details
    let prodError = { ...error }; // Work with a copy for production response

    // Handle known Sequelize errors
    if (err.name === "SequelizeValidationError")
      prodError = handleSequelizeValidationError(err);
    else if (err.name === "SequelizeUniqueConstraintError")
      prodError = handleSequelizeUniqueConstraintError(err);
    else if (err.name === "SequelizeForeignKeyConstraintError")
      prodError = handleSequelizeForeignKeyConstraintError(err);
    else if (err.name === "SequelizeDatabaseError")
      prodError = handleSequelizeDatabaseError(err);
    // Handle known JWT errors
    else if (err.name === "JsonWebTokenError") prodError = handleJWTError();
    else if (err.name === "TokenExpiredError")
      prodError = handleJWTExpiredError();

    // Log based on whether it's operational or programming error
    if (prodError.isOperational) {
      logger.warn(`Operational Error: ${prodError.message}`, {
        statusCode: prodError.statusCode,
        path: req.originalUrl,
        status: prodError.status,
      });
    } else {
      // Log the original, detailed error for internal debugging
      logger.error(`Programming/Unknown Error: ${err.message}`, {
        originalError: err,
        stack: err.stack,
        path: req.originalUrl,
      });
      // Override response details for client
      prodError.statusCode = 500;
      prodError.status = "error";
      prodError.message = "Something went very wrong! Please try again later.";
    }

    // Send generalized response to client in production
    return res.status(prodError.statusCode).json({
      status: prodError.status,
      message: prodError.message,
    });
  } else {
    // Fallback for other environments (e.g., test) - behave like development
    logger.error(`Test Env Error: ${error.message}`, {
      statusCode: error.statusCode,
      stack: err.stack,
    });
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
      stack: err.stack,
    });
  }
};

module.exports = globalErrorHandler;
