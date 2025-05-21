const { User, Order } = require("../db").models; // Adjust path as necessary
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const { hashPassword, comparePassword } = require("../utils/passwordUtils");
const logger = require("../utils/logger");

// GET /api/v1/users/me - Get current user's profile
exports.getMe = catchAsync(async (req, res, next) => {
  // req.user is populated by the 'protect' middleware
  // The User model's toJSON method should strip password_hash automatically
  const user = req.user;

  if (!user) {
    // Should not happen if protect middleware ran
    logger.error(
      "User not found in req.user after protect middleware in getMe."
    );
    return next(new AppError("User not found. Please log in again.", 401));
  }

  logger.debug(`Workspaceing profile for User ID: ${user.id}`);
  res.status(200).json({
    status: "success",
    data: {
      user, // user object from protect middleware (selected fields)
    },
  });
});

// PATCH /api/v1/users/me - Update current user's profile (e.g., full_name)
exports.updateMe = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { full_name } = req.body; // Only allow updating specific fields

  // Prevent updating sensitive fields like role or email directly via this route
  if (req.body.password || req.body.password_hash) {
    logger.warn(`User ${userId} attempted to update password via /me route.`);
    return next(
      new AppError(
        "Cannot update password via this route. Please use /change-password.",
        400
      )
    );
  }
  if (req.body.role) {
    logger.warn(`User ${userId} attempted to update role via /me route.`);
    return next(new AppError("Cannot update role via this route.", 400));
  }
  if (req.body.email) {
    logger.warn(`User ${userId} attempted to update email via /me route.`);
    return next(
      new AppError(
        "Cannot update email via this route. Contact support if needed.",
        400
      )
    );
  }

  const updates = {};
  if (full_name !== undefined) updates.full_name = full_name;
  // Add other allowed updatable fields here (e.g., phone_number if added to model)

  if (Object.keys(updates).length === 0) {
    return next(new AppError("No valid fields provided for update.", 400));
  }

  const [updateCount, [updatedUser]] = await User.update(updates, {
    where: { id: userId },
    returning: true, // Return the updated user record
  });

  if (updateCount === 0 || !updatedUser) {
    // This should ideally not happen if user ID is correct
    logger.error(
      `Failed to update profile for User ID: ${userId}. User not found or no changes made.`
    );
    return next(
      new AppError(
        "Could not update profile. User not found or no changes applied.",
        404
      )
    );
  }

  logger.info(`Profile updated successfully for User ID: ${userId}.`);
  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser, // updatedUser.toJSON() will be called by Express
    },
  });
});

// POST /api/v1/users/change-password - Change current user's password
exports.changePassword = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body; // Add confirmNewPassword validation if desired

  // 1. Get user from DB (including password_hash for comparison)
  const user = await User.findByPk(userId, {
    attributes: ["id", "password_hash"], // Only need these for this operation
  });

  if (!user) {
    // Should not happen if protect middleware worked
    logger.error(`User ${userId} not found during password change operation.`);
    return next(new AppError("User not found.", 404));
  }

  // 2. Check if currentPassword is correct
  if (!(await comparePassword(currentPassword, user.password_hash))) {
    logger.warn(
      `User ${userId} attempted password change with incorrect current password.`
    );
    return next(new AppError("Incorrect current password.", 401)); // Unauthorized
  }

  // 3. Check if newPassword is different from currentPassword
  if (await comparePassword(newPassword, user.password_hash)) {
    return next(
      new AppError(
        "New password must be different from the current password.",
        400
      )
    );
  }

  // 4. Hash and update password
  // The beforeUpdate hook in the User model will handle hashing `newPassword`
  user.password_hash = newPassword; // Temporarily set plain new password for the hook
  await user.save(); // Trigger validations and hooks

  // It's good practice to invalidate existing tokens/sessions after password change.
  // This could involve:
  //  - A `changedPasswordAt` field in the User model.
  //  - Blacklisting the old token if using a blacklist strategy.
  //  - Forcing re-login.
  // For simplicity, this example doesn't implement full token invalidation beyond expiry.

  logger.info(`Password changed successfully for User ID: ${userId}.`);
  res.status(200).json({
    status: "success",
    message:
      "Password changed successfully. Please log in with your new password if token invalidation is implemented.",
    // Optionally, can send a new token here if desired, or force re-login
  });
});

// Optional: DELETE /api/v1/users/me - Deactivate current user's account
// This usually involves setting an 'is_active' flag to false, not hard deletion.
// Hard deletion can have cascading effects and data integrity issues.
// exports.deactivateMe = catchAsync(async (req, res, next) => {
//   const userId = req.user.id;
//   // Find user and set is_active = false or add a deletedAt timestamp (soft delete)
//   await User.update({ is_active: false /* or deletedAt: new Date() */ }, { where: { id: userId } });
//   logger.info(`User account ${userId} deactivated.`);
//   // Invalidate tokens/sessions
//   res.status(204).json({ status: 'success', data: null });
// });
