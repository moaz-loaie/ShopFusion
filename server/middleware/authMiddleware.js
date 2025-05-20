const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const { User } = require("../db").models; // Assuming db/index.js exports models
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const jwtConfig = require("../config/jwt");

/**
 * Middleware to protect routes that require authentication.
 * Verifies the JWT token from the Authorization header.
 * Attaches the decoded user to req.user.
 */
const protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  // TODO: Add check for token in cookies if using cookie-based auth

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401) // Unauthorized
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, jwtConfig.secret);

  // 3) Check if user still exists
  const currentUser = await User.findByPk(decoded.id, {
    attributes: ["id", "email", "full_name", "role", "changedPasswordAt"], // Select necessary fields
  });
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does longer exist.",
        401 // Unauthorized
      )
    );
  }

  // 4) Check if user changed password after the token was issued
  // (Requires a 'changedPasswordAt' field in the User model)
  // if (currentUser.changedPasswordAfter(decoded.iat)) {
  //   return next(
  //     new AppError('User recently changed password! Please log in again.', 401)
  //   );
  // }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser; // Attach user to the request object
  next();
});

/**
 * Middleware factory to restrict routes to specific roles.
 * Should be used *after* the 'protect' middleware.
 * @param {...string} roles - Allowed roles (e.g., 'admin', 'seller').
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'seller']. req.user.role='customer'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action.", 403) // Forbidden
      );
    }
    next();
  };
};

module.exports = {
  protect,
  restrictTo,
};
