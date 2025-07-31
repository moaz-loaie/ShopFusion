const express = require("express");
const reviewController = require("../controllers/reviewController");
const { protect, restrictTo } = require("../middleware/authMiddleware");
const {
  idParamValidation,
  reviewValidation, // For updating a review
  reviewVoteValidation,
} = require("../middleware/validationMiddleware");

const router = express.Router();

// Note: Creating reviews is typically done via POST /api/v1/products/:productId/reviews
// This router handles actions on existing reviews or review-specific functionalities.

// All routes below require authentication
router.use(protect);

// Get a specific review by its ID
router.get("/:id", idParamValidation("id"), reviewController.getReviewById);

// Update a specific review (only owner)
router.patch(
  "/:id",
  idParamValidation("id"),
  reviewValidation, // Validate the review content
  reviewController.updateReview
);

// Delete a specific review (owner or admin)
router.delete("/:id", idParamValidation("id"), reviewController.deleteReview);

// Vote on a review
router.post(
  "/:reviewId/vote", // Changed param name to 'reviewId' to match validation
  reviewVoteValidation, // Validates reviewId from param and vote_type from body
  reviewController.voteReview
);

module.exports = router;
