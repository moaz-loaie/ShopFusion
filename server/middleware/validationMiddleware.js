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
    // Note: Logging detailed validation errors might expose input data, consider security implications.
    // logger.warn('Validation errors:', { path: req.originalUrl, errors: errors.array() });
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
  body("password").isLength({ min: 8 }).withMessage("must be at least 8 chars"),
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
    .toInt(), // Added param validation
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
  // Assuming shipping address and payment method are primary inputs for creation
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
    .escape(), // e.g., 'Credit Card', 'PayPal'
  // Actual payment processing details (like tokens) should be handled securely, not passed directly/validated here typically
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
  // Add other updatable profile fields here (e.g., phone number)
  handleValidationErrors,
];

// Change Password (Self)
const changePasswordValidation = [
  body("currentPassword").notEmpty().withMessage("required"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("must be at least 8 chars"),
  // Optional: confirm new password
  // body('confirmNewPassword').custom((value, { req }) => { if (value !== req.body.newPassword) { throw new Error('New passwords do not match'); } return true; }),
  handleValidationErrors,
];

// Admin Update User
const adminUserUpdateValidation = [
  param("userId")
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
  // Add other fields admin can modify (e.g., is_active boolean)
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
    .withMessage("feedback required for rejection") // Feedback required only if rejecting
    .bail() // Stop if feedback required but missing
    .optional({ checkFalsy: true }) // Allow empty if not rejecting (or make it optional always)
    .trim()
    .isLength({ max: 1000 })
    .withMessage("max 1000 chars")
    .escape(),
  handleValidationErrors,
];

// Generic ID Parameter Validation Factory
const idParamValidation = (idName = "id") => [
  param(idName)
    .isInt({ gt: 0 })
    .withMessage(`Invalid ${idName} parameter (must be positive integer)`)
    .toInt(),
  handleValidationErrors,
];

// Generic Pagination Query Validation
const paginationValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be positive integer")
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100")
    .toInt(), // Max limit 100
  query("sort")
    .optional()
    .matches(/^[\w]+:(asc|desc)$/i)
    .withMessage("sort must be in format field:direction (e.g., name:asc)"), // Basic format check
  query("search").optional().trim().escape(), // Sanitize search terms
  // Add specific filter validations if needed (e.g., category must be number)
  // query('category').optional().isInt({ gt: 0 }).withMessage('category filter must be a positive integer').toInt(),
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
  idParamValidation,
  paginationValidation,
};
