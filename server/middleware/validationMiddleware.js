const { validationResult, body, param, query } = require("express-validator");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");

// Centralized handler for validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((e) => `${e.param}: ${e.msg}`)
      .join("; ");
    return next(new AppError(`Invalid input - ${errorMessages}`, 400));
  }
  next();
};

// --- Validation & Sanitization Chains ---

// Registration
const registerValidation = [
  body("full_name")
    .trim()
    .notEmpty()
    .withMessage("required")
    .isLength({ min: 2, max: 100 })
    .withMessage("must be 2-100 chars")
    .escape(),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("required")
    .isEmail()
    .withMessage("invalid format")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("must be at least 8 chars"),
  body("role")
    .optional()
    .isIn(["customer", "seller"])
    .withMessage("invalid role"),
  handleValidationErrors,
];

// Login
const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("required")
    .isEmail()
    .withMessage("invalid format")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("required"),
  handleValidationErrors,
];

// Product Create/Update
const productValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("required")
    .isLength({ min: 3, max: 200 })
    .withMessage("must be 3-200 chars")
    .escape(),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("required")
    .isLength({ max: 5000 })
    .withMessage("max 5000 chars")
    .escape(),
  body("price")
    .notEmpty()
    .withMessage("required")
    .isFloat({ gt: 0 })
    .withMessage("must be positive number")
    .toFloat(),
  body("stock_quantity")
    .notEmpty()
    .withMessage("required")
    .isInt({ min: 0 })
    .withMessage("must be non-negative integer")
    .toInt(),
  body("category_id")
    .notEmpty()
    .withMessage("required")
    .isInt({ gt: 0 })
    .withMessage("valid ID required")
    .toInt(),
  body("preview_image_url")
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage("must be valid URL")
    .trim(),
  handleValidationErrors,
];

// Category Create/Update
const categoryValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("required")
    .isLength({ min: 2, max: 100 })
    .withMessage("must be 2-100 chars")
    .escape(),
  body("description")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("max 1000 chars")
    .escape(),
  body("thumbnail_url")
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage("must be valid URL")
    .trim(),
  handleValidationErrors,
];

// Review Create/Update
const reviewValidation = [
  body("rating")
    .notEmpty()
    .withMessage("required")
    .isInt({ min: 1, max: 5 })
    .withMessage("must be 1-5")
    .toInt(),
  body("review_text")
    .trim()
    .notEmpty()
    .withMessage("required")
    .isLength({ min: 5, max: 1000 })
    .withMessage("must be 5-1000 chars")
    .escape(),
  handleValidationErrors,
];

// Review Vote
const reviewVoteValidation = [
  param("reviewId")
    .isInt({ gt: 0 })
    .withMessage("valid review ID required in URL")
    .toInt(),
  body("vote_type")
    .isIn(["helpful", "not helpful"])
    .withMessage('must be "helpful" or "not helpful"'),
  handleValidationErrors,
];

// Add Item to Cart
const cartItemAddValidation = [
  body("productId")
    .notEmpty()
    .withMessage("required")
    .isInt({ gt: 0 })
    .withMessage("valid ID required")
    .toInt(),
  body("quantity")
    .notEmpty()
    .withMessage("required")
    .isInt({ min: 1 })
    .withMessage("must be at least 1")
    .toInt(),
  handleValidationErrors,
];

// Update Cart Item Quantity
const cartItemUpdateValidation = [
  param("itemId")
    .isInt({ gt: 0 })
    .withMessage("valid cart item ID required in URL")
    .toInt(),
  body("quantity")
    .notEmpty()
    .withMessage("required")
    .isInt({ min: 1 })
    .withMessage("must be at least 1")
    .toInt(),
  handleValidationErrors,
];

// Create Order
const orderCreateValidation = [
  body("shipping_address")
    .trim()
    .notEmpty()
    .withMessage("required")
    .isLength({ min: 10, max: 500 })
    .withMessage("must be 10-500 chars")
    .escape(),
  body("payment_method")
    .trim()
    .notEmpty()
    .withMessage("required")
    .isLength({ max: 50 })
    .withMessage("max 50 chars")
    .escape(),
  handleValidationErrors,
];

// Update User Profile (Self)
const userProfileUpdateValidation = [
  body("full_name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("cannot be empty if provided")
    .isLength({ min: 2, max: 100 })
    .withMessage("must be 2-100 chars")
    .escape(),
  handleValidationErrors,
];

// Change Password (Self)
const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("required"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("must be at least 8 chars"),
  handleValidationErrors,
];

// Admin Update User
const adminUserUpdateValidation = [
  param("id")
    .isInt({ gt: 0 })
    .withMessage("valid user ID required in URL")
    .toInt(),
  body("full_name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("cannot be empty if provided")
    .isLength({ min: 2, max: 100 })
    .withMessage("must be 2-100 chars")
    .escape(),
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("invalid email format")
    .normalizeEmail(),
  body("role")
    .optional()
    .isIn(["customer", "seller", "admin"])
    .withMessage("invalid role"),
  handleValidationErrors,
];

// Admin Moderation Decision
const moderationDecisionValidation = [
  param("moderationId")
    .isInt({ gt: 0 })
    .withMessage("valid moderation ID required in URL")
    .toInt(),
  body("status")
    .isIn(["approved", "rejected"])
    .withMessage('must be "approved" or "rejected"'),
  body("feedback")
    .if(body("status").equals("rejected"))
    .notEmpty()
    .withMessage("feedback required for rejection")
    .bail()
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("max 1000 chars")
    .escape(),
  handleValidationErrors,
];

// Dispute Update
const disputeUpdateValidation = [
  param("id")
    .isInt({ gt: 0 })
    .withMessage("valid dispute ID required")
    .toInt(),
  body("status")
    .isIn(['open', 'resolved', 'rejected', 'under_review'])
    .withMessage("Invalid status. Must be 'open', 'resolved', 'rejected', or 'under_review'"),
  body("resolution_details")
    .if(body("status").isIn(['resolved', 'rejected']))
    .notEmpty()
    .withMessage("Resolution details are required when resolving or rejecting a dispute")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Resolution details must be between 10 and 2000 characters"),
  handleValidationErrors,
];

// Product Status Update
const productStatusValidation = [
  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["pending", "approved", "rejected"])
    .withMessage("Invalid status value"),
  body("feedback")
    .optional()
    .trim()
    .isString()
    .withMessage("Feedback must be text")
    .isLength({ max: 1000 })
    .withMessage("Feedback cannot exceed 1000 characters"),
  handleValidationErrors,
];

// Validation for moderation feedback update
const moderationFeedbackUpdateValidation = [
  param("moderationId")
    .isInt({ gt: 0 })
    .withMessage("valid moderation ID required in URL")
    .toInt(),
  body("feedback")
    .trim()
    .notEmpty()
    .withMessage("feedback is required")
    .isLength({ max: 1000 })
    .withMessage("feedback must not exceed 1000 characters")
    .escape(),
  handleValidationErrors,
];

// Seller Status Update
const sellerStatusValidation = [
  param("id")
    .isInt({ gt: 0 })
    .withMessage("valid seller ID required")
    .toInt(),
  body("is_active")
    .isBoolean()
    .withMessage("Status must be a boolean value"),
  handleValidationErrors,
];

// Order Status Update Validation
const orderStatusUpdateValidation = [
  param("id")
    .isInt({ gt: 0 })
    .withMessage("Valid order ID required")
    .toInt(),
  body("order_status")
    .isIn(['pending_payment', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Status must be one of: pending_payment, processing, shipped, delivered, cancelled')
    .notEmpty(),
  body("shipping_status")
    .optional()
    .isIn(['processing', 'shipped', 'delivered'])
    .withMessage('Shipping status must be one of: processing, shipped, delivered'),
  body("tracking_number")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 5, max: 50 })
    .withMessage('Tracking number must be between 5 and 50 characters'),
  body("carrier")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Carrier name must be between 2 and 50 characters'),
  handleValidationErrors
];

// Generic ID Parameter Validation Factory
const idParamValidation = (idName = "id") => [
  param(idName)
    .isInt({ gt: 0 })
    .withMessage(`Invalid ${idName} parameter (must be positive integer)`)
    .toInt(),
  handleValidationErrors,
];

module.exports = {
  registerValidation,
  loginValidation,
  productValidation,
  categoryValidation,
  reviewValidation,
  reviewVoteValidation,
  cartItemAddValidation,
  cartItemUpdateValidation,
  orderCreateValidation,
  userProfileUpdateValidation,
  changePasswordValidation,
  adminUserUpdateValidation,
  moderationDecisionValidation,
  disputeUpdateValidation,
  productStatusValidation,
  moderationFeedbackUpdateValidation,
  sellerStatusValidation,
  orderStatusUpdateValidation,
  idParamValidation
};
