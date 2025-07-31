const express = require("express");
const settingsController = require("../controllers/settingsController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

const router = express.Router();

// Public route - no authentication required
router.get("/public", settingsController.getPublicSettings);

// Admin routes - requires authentication and admin role
router.use(protect);
router.use(restrictTo("admin"));

router
  .route("/")
  .get(settingsController.getSystemSettings)
  .put(settingsController.updateSystemSettings);

module.exports = router;
