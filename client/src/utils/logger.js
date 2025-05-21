// File: client/src/utils/logger.js (Simple Frontend Logger)
/* eslint-disable no-console */ // Allow console logging for this utility

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

// Determine log level (e.g., from env variable or default based on NODE_ENV)
// Default to INFO in production, DEBUG in development
const CURRENT_LOG_LEVEL = process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;

const logger = {
  error: (...args) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.ERROR) {
      console.error('[ERROR]', ...args);
      // TODO: Integrate with error tracking service like Sentry in production
      // if (process.env.NODE_ENV === 'production' && window.Sentry) {
      //   window.Sentry.captureException(args[0] instanceof Error ? args[0] : new Error(String(args[0])), { extra: { args } });
      // }
    }
  },
  warn: (...args) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.WARN) {
      console.warn('[WARN]', ...args);
    }
  },
  info: (...args) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.INFO) {
      console.info('[INFO]', ...args);
    }
  },
  debug: (...args) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.DEBUG) {
      console.debug('[DEBUG]', ...args);
    }
  },
};

export default logger;