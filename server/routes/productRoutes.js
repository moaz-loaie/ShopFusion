const express = require("express");
const productController = require("../controllers/productController");
// Use reviewController for review-specific actions if separated
const reviewController = require("../controllers/reviewController");
const { protect, restrictTo } = require("../middleware/authMiddleware");
const {
  productValidation,
  reviewValidation,
  idParamValidation,
  paginationValidation, // Add pagination validation
} = require("../middleware/validationMiddleware");

const router = express.Router();

// --- Product Routes ---

router
  .route("/")
  .get(paginationValidation, productController.getAllProducts) // Public, add pagination validation
  .post(
    protect,
    restrictTo("seller", "admin"),
    productValidation,
    productController.createProduct
  );

router
  .route("/:id")
  .get(idParamValidation("id"), productController.getProductById) // Public
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

// --- Nested Review Routes ---

router
  .route("/:productId/reviews")
  .get(
    idParamValidation("productId"),
    paginationValidation, // Add pagination for reviews
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
