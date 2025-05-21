const { Review, ReviewVote, Product, User, sequelize } =
  require("../db").models;
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");

// Helper to find a review or throw an error
const findReviewOrThrow = async (reviewId, includeUser = false) => {
  const includeOptions = [];
  if (includeUser) {
    includeOptions.push({
      model: User,
      as: "User",
      attributes: ["id", "full_name"],
    });
  }
  const review = await Review.findByPk(reviewId, { include: includeOptions });
  if (!review) {
    throw new AppError("Review not found", 404);
  }
  return review;
};

// GET /api/v1/reviews/:id - Get a specific review (e.g., for editing by owner)
// Note: Get reviews for a product is in productController.js
exports.getReviewById = catchAsync(async (req, res, next) => {
  const reviewId = req.params.id;
  const review = await findReviewOrThrow(reviewId, true); // Include user who wrote it

  res.status(200).json({
    status: "success",
    data: {
      review,
    },
  });
});

// PATCH /api/v1/reviews/:id - Update a review (Owner only)
exports.updateReview = catchAsync(async (req, res, next) => {
  const reviewId = req.params.id;
  const userId = req.user.id; // Authenticated user
  const { rating, review_text } = req.body;

  const review = await findReviewOrThrow(reviewId);

  // Authorization: Check if the logged-in user is the owner of the review
  if (review.user_id !== userId) {
    logger.warn(
      `User ${userId} attempted to update review ${reviewId} owned by User ${review.user_id}.`
    );
    return next(
      new AppError("You do not have permission to update this review.", 403)
    ); // Forbidden
  }

  // Update allowed fields
  if (rating !== undefined) review.rating = rating;
  if (review_text !== undefined) review.review_text = review_text;

  await review.save(); // This will trigger model validations

  // TODO: Recalculate product's average rating after review update
  // This could be a separate utility function or a database trigger/stored procedure.
  // Example: await updateProductAverageRating(review.product_id);

  logger.info(`Review ${reviewId} updated successfully by User ${userId}.`);
  res.status(200).json({
    status: "success",
    data: {
      review,
    },
  });
});

// DELETE /api/v1/reviews/:id - Delete a review (Owner or Admin)
exports.deleteReview = catchAsync(async (req, res, next) => {
  const reviewId = req.params.id;
  const user = req.user; // Authenticated user (id, role)

  const review = await findReviewOrThrow(reviewId);

  // Authorization: Check if owner or admin
  if (review.user_id !== user.id && user.role !== "admin") {
    logger.warn(
      `User ${user.id} (Role: ${user.role}) attempted to delete review ${reviewId} owned by User ${review.user_id}.`
    );
    return next(
      new AppError("You do not have permission to delete this review.", 403)
    );
  }

  const productId = review.product_id; // Store before deleting for potential rating update
  await review.destroy();

  // TODO: Recalculate product's average rating after review deletion
  // Example: await updateProductAverageRating(productId);

  logger.info(
    `Review ${reviewId} deleted successfully by User ${user.id} (Role: ${user.role}).`
  );
  res.status(204).json({
    // 204 No Content
    status: "success",
    data: null,
  });
});

// POST /api/v1/reviews/:reviewId/vote - Vote on a review (helpful/not_helpful)
exports.voteReview = catchAsync(async (req, res, next) => {
  const reviewId = req.params.reviewId;
  const userId = req.user.id;
  const { vote_type } = req.body; // 'helpful' or 'not_helpful'

  const review = await findReviewOrThrow(reviewId);

  // Business Rule: User cannot vote on their own review
  if (review.user_id === userId) {
    logger.warn(
      `User ${userId} attempted to vote on their own review ${reviewId}.`
    );
    return next(new AppError("You cannot vote on your own review.", 403));
  }

  // Find existing vote or create a new one
  let reviewVote = await ReviewVote.findOne({
    where: { review_id: reviewId, user_id: userId },
  });

  if (reviewVote) {
    // User is changing their vote or re-voting with the same type
    if (reviewVote.vote_type === vote_type) {
      // Optional: Allow un-voting by submitting the same vote_type again
      // await reviewVote.destroy();
      // logger.info(`User ${userId} removed vote for review ${reviewId}.`);
      // return res.status(200).json({ status: 'success', message: 'Vote removed.' });
      return next(new AppError("You have already voted this way.", 409)); // Conflict
    } else {
      reviewVote.vote_type = vote_type;
      await reviewVote.save();
      logger.info(
        `User ${userId} changed vote to '${vote_type}' for review ${reviewId}.`
      );
    }
  } else {
    // New vote
    reviewVote = await ReviewVote.create({
      review_id: reviewId,
      user_id: userId,
      vote_type,
    });
    logger.info(
      `User ${userId} cast new vote '${vote_type}' for review ${reviewId}.`
    );
  }

  // TODO: Optionally, update helpful/not_helpful counts on the Review model itself for quick retrieval
  // This would likely involve a transaction and re-querying counts or using increment/decrement.

  res.status(200).json({
    // 200 OK or 201 if new vote created
    status: "success",
    message: `Vote registered as '${vote_type}'.`,
    data: {
      reviewVote,
    },
  });
});
