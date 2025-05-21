const express = require("express");
const authController = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware"); // protect middleware
const {
  registerValidation,
  loginValidation,
} = require("../middleware/validationMiddleware");

const router = express.Router();

router.post("/register", registerValidation, authController.register);
router.post("/login", loginValidation, authController.login);
router.get("/logout", authController.logout); // Simple endpoint, mainly for client signal

// Optional endpoint to verify token validity and get user data
router.get("/verify", protect, authController.verify);

module.exports = router;
