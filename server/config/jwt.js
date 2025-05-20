require("dotenv").config(); // Load environment variables

module.exports = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || "1d", // Default to 1 day if not set
};

if (!module.exports.secret) {
  console.error(
    "FATAL ERROR: JWT_SECRET is not defined in environment variables."
  );
  process.exit(1); // Exit if secret is missing
}
