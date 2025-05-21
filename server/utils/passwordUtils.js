const bcrypt = require("bcryptjs");
const logger = require("./logger");

const SALT_ROUNDS = 12; // Use a higher salt round for better security (10-12 recommended)

/**
 * Hashes a plain text password using bcrypt.
 * @param {string} password - The plain text password.
 * @returns {Promise<string>} The hashed password.
 * @throws {Error} If hashing fails.
 */
const hashPassword = async (password) => {
  if (!password) {
    logger.error("Attempted to hash an empty password.");
    throw new Error("Password cannot be empty."); // Prevent hashing empty strings
  }
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    logger.error("Error hashing password:", error);
    throw new Error("Password hashing failed."); // Throw generic error
  }
};

/**
 * Compares a plain text password with a stored bcrypt hash.
 * @param {string} candidatePassword - The plain text password provided by the user.
 * @param {string} hashedPassword - The stored hashed password from the database.
 * @returns {Promise<boolean>} True if passwords match, false otherwise.
 */
const comparePassword = async (candidatePassword, hashedPassword) => {
  if (!candidatePassword || !hashedPassword) {
    return false; // Cannot compare if either is missing
  }
  try {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  } catch (error) {
    logger.error("Error comparing password:", error);
    // Treat comparison errors as non-match for security
    return false;
  }
};

module.exports = {
  hashPassword,
  comparePassword,
};
