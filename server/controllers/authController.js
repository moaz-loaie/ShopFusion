const jwt = require("jsonwebtoken");
const { User } = require("../db").models;
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const { hashPassword, comparePassword } = require("../utils/passwordUtils");
const jwtConfig = require("../config/jwt");
const logger = require("../utils/logger");

// Helper to sign JWT token
const signToken = (userId) => {
  // Ensure userId is valid before signing
  if (!userId) {
    throw new Error("User ID is required to sign token");
  }
  return jwt.sign({ id: userId }, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  });
};

// Helper to create and send token response
// Sends token via JSON body. Consider HttpOnly cookies for enhanced security.
const createSendToken = (user, statusCode, res) => {
  try {
    const token = signToken(user.id);

    // Remove password hash from the user object before sending the response
    const userResponse = user.toJSON ? user.toJSON() : { ...user }; // Use toJSON if available
    delete userResponse.password_hash; // Ensure it's deleted

    logger.info(`Token generated successfully for User ID: ${user.id}`);

    res.status(statusCode).json({
      status: "success",
      token,
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    logger.error(
      `Error generating or sending token for User ID ${user?.id}:`,
      error
    );
    // Avoid sending error details to client, handle via global handler if needed
    // This specific error is internal, shouldn't usually reach client directly
    throw new AppError("Error processing authentication.", 500);
  }
};

// POST /api/v1/auth/register
exports.register = catchAsync(async (req, res, next) => {
  const { full_name, email, password, role } = req.body;

  // Basic input check (though validation middleware handles specifics)
  if (!full_name || !email || !password) {
    logger.warn("Registration attempt with missing fields.");
    // Let validation middleware handle this, but good defensive check
    return next(
      new AppError("Please provide full name, email, and password", 400)
    );
  }

  // Determine role - default to 'customer' if invalid/missing, allow 'seller'
  const allowedRoles = ["customer", "seller"];
  const userRole = role && allowedRoles.includes(role) ? role : "customer";

  // NOTE: Password hashing is now handled by the `beforeCreate` hook in the User model.
  // We pass the plain password to User.create.
  const newUser = await User.create({
    full_name,
    email,
    password_hash: password, // Pass plain password - Hook will hash it
    role: userRole,
  });

  logger.info(
    `User registered successfully: ${newUser.email} (ID: ${newUser.id}), Role: ${userRole}`
  );

  // Login the user immediately after registration
  createSendToken(newUser, 201, res); // 201 Created
});

// POST /api/v1/auth/login
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Basic check (validation middleware preferred)
  if (!email || !password) {
    logger.warn("Login attempt with missing email or password.");
    return next(new AppError("Please provide email and password!", 400));
  }

  // 2) Find user by email
  // Explicitly select password_hash as it's excluded by default by toJSON
  const user = await User.findOne({
    where: { email },
    attributes: ["id", "email", "full_name", "role", "password_hash"], // Include hash for comparison
  });

  // 3) Check if user exists and password is correct
  if (!user || !(await comparePassword(password, user.password_hash))) {
    logger.warn(`Failed login attempt for email: ${email}`);
    return next(new AppError("Incorrect email or password", 401)); // Unauthorized
  }

  // 4) If everything is ok, send token to client
  logger.info(`User logged in successfully: ${user.email} (ID: ${user.id})`);
  createSendToken(user, 200, res); // 200 OK
});

// GET /api/v1/auth/logout (Example - primarily for cookie clearing if used)
exports.logout = (req, res) => {
  // If using HttpOnly cookies for JWT, clear the cookie here:
  // res.cookie('jwt', 'loggedout', {
  //   expires: new Date(Date.now() + 10 * 1000), // Expire quickly
  //   httpOnly: true,
  //   secure: process.env.NODE_ENV === 'production',
  //   sameSite: 'strict' // Or 'lax' depending on needs
  // });
  logger.info(`Logout endpoint called by User ID: ${req.user?.id || "N/A"}`);
  res
    .status(200)
    .json({
      status: "success",
      message: "Logged out (client should clear token)",
    });
};

// Optional: Verify Token Endpoint (e.g., for frontend checks on load)
// GET /api/v1/auth/verify
exports.verify = catchAsync(async (req, res, next) => {
  // This route relies on the 'protect' middleware having run successfully
  // If protect runs, req.user is populated and valid.
  logger.debug(`Token verified for User ID: ${req.user.id}`);
  res.status(200).json({
    status: "success",
    data: {
      user: req.user, // req.user already excludes password_hash from protect middleware query
    },
  });
});
