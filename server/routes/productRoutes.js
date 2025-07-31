const express = require("express");
const productController = require("../controllers/productController");
const reviewController = require("../controllers/reviewController");
const { protect, restrictTo } = require("../middleware/authMiddleware");
const { paginationMiddleware } = require("../middleware/paginationMiddleware");
const roleBasedAccess = require("../middleware/roleBasedAccess");
const {
  productValidation,
  reviewValidation,
  idParamValidation,
  productStatusValidation,
} = require("../middleware/validationMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// --- Product Routes ---

router
  .route("/")
  .get(
    paginationMiddleware(12, 100),
    roleBasedAccess,
    productController.getAllProducts
  )
  .post(
    protect,
    restrictTo("seller", "admin"),
    upload.array("images", 5), // Accept up to 5 images
    productValidation,
    productController.createProduct
  );

router
  .route("/:id")
  .get(
    idParamValidation("id"),
    roleBasedAccess,
    productController.getProductById
  ) // Public
  .patch(
    protect,
    restrictTo("seller", "admin"),
    idParamValidation("id"),
    productValidation, // Reuse same validation, controller checks ownership/permissions
    productController.updateProduct
  )
  .delete(
    protect,
    restrictTo("seller", "admin"),
    idParamValidation("id"),
    productController.deleteProduct
  );

// Product status updates (admin only)
router
  .route("/:id/status")
  .patch(
    protect,
    restrictTo("admin"),
    idParamValidation("id"),
    productStatusValidation,
    productController.updateProductStatus
  );

// --- Nested Review Routes ---

router
  .route("/:productId/reviews")
  .get(
    idParamValidation("productId"),
    paginationMiddleware(10, 50),
    productController.getProductReviews // Use product controller for consistency here
  )
  .post(
    protect,
    restrictTo("customer"), // Only authenticated customers can post reviews
    idParamValidation("productId"),
    reviewValidation,
    productController.createProductReview // Use product controller
  );

// If review edits/deletes are allowed, add routes here or in reviewRoutes.js
// Example using reviewController if separated:
// router.route('/:productId/reviews/:reviewId')
//    .patch(protect, reviewController.updateReview) // Need logic to check ownership
//    .delete(protect, reviewController.deleteReview); // Need logic to check ownership or admin

module.exports = router;
