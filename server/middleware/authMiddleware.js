const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const { User } = require("../db").models; // Adjust path if models are elsewhere
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const jwtConfig = require("../config/jwt");
const logger = require("../utils/logger");

/**
 * Middleware to protect routes that require authentication.
 * Verifies the JWT token from the Authorization header.
 * Attaches the decoded user (excluding sensitive info) to req.user.
 */
const protect = catchAsync(async (req, res, next) => {
  // 1) Get token and check if it exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  // TODO: Add support for checking tokens in cookies if implementing refresh tokens securely

  if (!token) {
    logger.warn("Auth middleware - No token found in Authorization header");
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401) // Unauthorized
    );
  }

  // 2) Verify token
  let decoded;
  try {
    // Use promisify for async verification if needed, but jwt.verify is synchronous by default
    decoded = await promisify(jwt.verify)(token, jwtConfig.secret);
    // Alternatively, use synchronous verify if no complex checks needed in callback
    // decoded = jwt.verify(token, jwtConfig.secret);
  } catch (err) {
    // Handle specific JWT errors (passed to global error handler)
    if (err.name === "JsonWebTokenError") {
      logger.warn("Auth middleware - Invalid token signature");
      return next(new AppError("Invalid token. Please log in again.", 401));
    }
    if (err.name === "TokenExpiredError") {
      logger.warn("Auth middleware - Token expired");
      return next(
        new AppError("Your session has expired. Please log in again.", 401)
      );
    }
    // For other errors during verification
    logger.error("Auth middleware - Token verification error:", err);
    return next(
      new AppError("Token verification failed. Please log in again.", 401)
    );
  }

  // 3) Check if user associated with the token still exists
  const currentUser = await User.findByPk(decoded.id, {
    attributes: ["id", "email", "full_name", "role"], // Select only necessary, non-sensitive fields
    // Add 'changedPasswordAt' if implementing password change check
  });

  if (!currentUser) {
    logger.warn(
      `Auth middleware - User with ID ${decoded.id} belonging to token no longer exists`
    );
    return next(
      new AppError("The user belonging to this token no longer exists.", 401) // Unauthorized
    );
  }

  // 4) Optional: Check if user changed password after the token was issued
  // if (currentUser.changedPasswordAfter(decoded.iat)) { // Assumes method exists on User model
  //   logger.warn(`Auth middleware - User ${currentUser.id} changed password after token issuance`);
  //   return next(
  //     new AppError('User recently changed password! Please log in again.', 401)
  //   );
  // }

  // Grant access: Attach user to the request object
  req.user = currentUser;
  logger.debug(
    `Auth middleware - User ${currentUser.id} authenticated. Role: ${currentUser.role}`
  );
  next();
});

/**
 * Middleware factory to restrict routes to specific roles.
 * Should be used *after* the 'protect' middleware.
 * Throws a 403 Forbidden error if the authenticated user's role is not allowed.
 * @param {...string} allowedRoles - Allowed roles (e.g., 'admin', 'seller', 'customer').
 */
const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if req.user exists (should be set by 'protect' middleware)
    if (!req.user || !req.user.role) {
      logger.error(
        "RestrictTo middleware - req.user or req.user.role not defined. Ensure protect middleware runs first."
      );
      return next(
        new AppError("Authentication error. Cannot verify user role.", 500)
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(
        `Authorization failed for User ${req.user.id}. Role '${
          req.user.role
        }' not in allowed roles: [${allowedRoles.join(", ")}]`
      );
      return next(
        new AppError("You do not have permission to perform this action.", 403) // Forbidden
      );
    }

    // User has the required role, grant access
    logger.debug(
      `Authorization success for User ${req.user.id}. Role '${req.user.role}' is allowed.`
    );
    next();
  };
};

module.exports = {
  protect,
  restrictTo,
};
