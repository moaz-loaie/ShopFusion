const express = require("express");
const userSettingsController = require("../controllers/userSettingsController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get and update user settings
router.route("/")
  .get(userSettingsController.getUserSettings)
  .put(userSettingsController.updateUserSettings);

module.exports = router;
