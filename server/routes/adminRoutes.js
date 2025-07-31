const express = require("express");
const { body, param } = require("express-validator");
const adminController = require("../controllers/adminController");
const { protect, restrictTo } = require("../middleware/authMiddleware");
const { paginationMiddleware } = require("../middleware/paginationMiddleware");
const {  idParamValidation,
  adminUserUpdateValidation, // Validation specific to admin updating a user
  moderationDecisionValidation, // Validation for moderation status/feedback
  moderationFeedbackUpdateValidation, // Validation for moderation feedback updates
  handleValidationErrors,
  sellerStatusValidation, // Validation for seller status updates
  disputeUpdateValidation, // Validation for dispute status updates
  orderStatusUpdateValidation // Validation for order status updates
} = require("../middleware/validationMiddleware");

const router = express.Router();

// All admin routes are protected and restricted to 'admin' role
router.use(protect);
router.use(restrictTo("admin"));

// --- User Management Routes ---
router.route("/users").get(paginationMiddleware(10, 100), adminController.getAllUsers); // GET /api/v1/admin/users

router
  .route("/users/:id")
  .get(
    idParamValidation("id"),
    adminController.getUserById
  ) // GET /api/v1/admin/users/:id
  .patch(
    idParamValidation("id"),
    adminUserUpdateValidation,
    adminController.updateUser
  ) // PATCH /api/v1/admin/users/:id
  .delete(
    idParamValidation("id"),
    adminController.deleteUser
  );// DELETE /api/v1/admin/users/:id

// --- Product Moderation Routes ---
router  .route("/products/moderation")
  .get(paginationMiddleware(10, 50), adminController.getProductsForModeration);// GET /api/v1/admin/products/moderation

router
  .route("/products/moderation/:moderationId") // moderationId is the ID of the ModerationQueue entry
  .patch(moderationDecisionValidation, adminController.moderateProduct); // PATCH /api/v1/admin/products/moderation/:moderationId

router
  .route("/products/moderation/:moderationId/feedback")
  .patch(moderationFeedbackUpdateValidation, adminController.updateModerationFeedback); // PATCH /api/v1/admin/products/moderation/:moderationId/feedback

// --- Order Management Routes ---
router.route("/orders").get(paginationMiddleware(10, 50), adminController.getAllOrders); // GET /api/v1/admin/orders

router
  .route("/orders/:id")
  .get(idParamValidation("id"), adminController.getAdminOrderById); // GET /api/v1/admin/orders/:id

router
  .route("/orders/:id/status")
  .patch(
    orderStatusUpdateValidation,
    adminController.updateOrderStatus);

// --- Dispute Management Routes ---
router
  .route("/disputes")
  .get(paginationMiddleware(10, 50), adminController.getAllDisputes);

router  .route("/disputes/:id")
  .get(idParamValidation("id"), adminController.getDisputeById)
  .patch(disputeUpdateValidation, adminController.updateDispute);

// --- Seller Management Routes ---
router
  .route("/sellers")
  .get(paginationMiddleware(10, 50), adminController.getAllSellers);

router.route("/sellers/:id/status")
  .patch(
    sellerStatusValidation,
    adminController.updateSellerStatus
  );

// Dashboard Statistics
router.get("/dashboard/stats", adminController.getDashboardStats);

module.exports = router;
