require("dotenv").config(); // Load environment variables
const logger = require("../utils/logger"); // Import logger

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h"; // Default to 1 hour

if (!JWT_SECRET) {
  logger.error(
    "FATAL ERROR: JWT_SECRET is not defined in environment variables. Application cannot start securely."
  );
  process.exit(1); // Exit if secret is missing
}
if (
  JWT_SECRET ===
    "replace_this_with_a_very_strong_random_secret_key_minimum_32_chars" ||
  JWT_SECRET.length < 32
) {
  logger.warn(
    "WARNING: Using default or insecure JWT_SECRET. Please set a strong secret in your .env file for production!"
  );
  // In a real production scenario, you might want to exit here too if NODE_ENV is production
  // if (process.env.NODE_ENV === 'production') process.exit(1);
}

module.exports = {
  secret: JWT_SECRET,
  expiresIn: JWT_EXPIRES_IN,
  // Optional: Add refresh token config if implemented
  // refreshSecret: process.env.REFRESH_JWT_SECRET,
  // refreshExpiresIn: process.env.REFRESH_JWT_EXPIRES_IN || '7d',
};

// Verify refresh token secrets if implemented
// if (!module.exports.refreshSecret && process.env.NODE_ENV !== 'test') { /* Check and warn/exit */ }
