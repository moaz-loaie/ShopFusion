const express = require("express");
const userController = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const {
  userProfileUpdateValidation,
  changePasswordValidation,
} = require("../middleware/validationMiddleware");

const router = express.Router();

// All routes below are protected and require user to be authenticated
router.use(protect);

// Routes for the currently authenticated user
router
  .route("/me")
  .get(userController.getMe) // Get current user's profile
  .patch(userProfileUpdateValidation, userController.updateMe); // Update current user's profile

router.post(
  "/change-password",
  changePasswordValidation,
  userController.changePassword
);

// Optional: Route for deactivating account
// router.delete('/me/deactivate', userController.deactivateMe);

// Note: Admin routes for managing other users (GET /users, GET /users/:id, etc.)
// should be in adminRoutes.js and protected by restrictTo('admin').

module.exports = router;
