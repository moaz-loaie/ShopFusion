const winston = require("winston");
require("dotenv").config();

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};
const defaultLevel = process.env.NODE_ENV === "production" ? "warn" : "debug";
const currentLevel = process.env.LOG_LEVEL || defaultLevel;

// Use different formats for development (colorized) and production (JSON)
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) =>
      `${info.timestamp} ${info.level}: ${info.message}` +
      (info.stack ? `\n${info.stack}` : "")
  )
);

const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }), // Include stack traces in error objects
  winston.format.json() // Log in JSON format for easier parsing by log management systems
);

const format = process.env.NODE_ENV === "production" ? prodFormat : devFormat;

// Define transports
const transports = [
  new winston.transports.Console({
    handleExceptions: true, // Log uncaught exceptions
    // Optional: handle rejections (though process listeners are often preferred)
    // handleRejections: true,
  }),
  // --- Optional: File Transports for Production ---
  // new winston.transports.File({
  //   filename: 'logs/error.log',
  //   level: 'error', // Only log errors to this file
  //   handleExceptions: true,
  //   maxsize: 5242880, // 5MB
  //   maxFiles: 5,
  // }),
  // new winston.transports.File({
  //   filename: 'logs/combined.log',
  //   handleExceptions: true,
  //   maxsize: 5242880, // 5MB
  //   maxFiles: 5,
  // }),
];

// Create the logger instance
const logger = winston.createLogger({
  level: currentLevel,
  levels,
  format,
  transports,
  exitOnError: false, // Do not exit on handled exceptions logged via logger.error
});

// Add stream interface for Morgan compatibility
logger.stream = {
  write: (message) => {
    // Use 'http' level for Morgan logs
    logger.http(message.trim());
  },
};

// Log current level on startup
logger.info(`Logger initialized at level: ${currentLevel}`);

module.exports = logger;
