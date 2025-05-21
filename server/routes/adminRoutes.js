const express = require("express");
const adminController = require("../controllers/adminController");
const { protect, restrictTo } = require("../middleware/authMiddleware");
const {
  idParamValidation,
  paginationValidation,
  adminUserUpdateValidation, // Validation specific to admin updating a user
  moderationDecisionValidation, // Validation for moderation status/feedback
  // Add validation for order status update if needed
} = require("../middleware/validationMiddleware");

const router = express.Router();

// All admin routes are protected and restricted to 'admin' role
router.use(protect);
router.use(restrictTo("admin"));

// --- User Management Routes ---
router.route("/users").get(paginationValidation, adminController.getAllUsers); // GET /api/v1/admin/users

router
  .route("/users/:id")
  .get(idParamValidation("id"), adminController.getUserById) // GET /api/v1/admin/users/:id
  .patch(adminUserUpdateValidation, adminController.updateUser) // PATCH /api/v1/admin/users/:id (id validated by adminUserUpdateValidation)
  .delete(idParamValidation("id"), adminController.deleteUser); // DELETE /api/v1/admin/users/:id

// --- Product Moderation Routes ---
router
  .route("/products/moderation")
  .get(paginationValidation, adminController.getProductsForModeration); // GET /api/v1/admin/products/moderation

router
  .route("/products/moderation/:moderationId") // moderationId is the ID of the ModerationQueue entry
  .patch(moderationDecisionValidation, adminController.moderateProduct); // PATCH /api/v1/admin/products/moderation/:moderationId

// --- Order Management Routes ---
router.route("/orders").get(paginationValidation, adminController.getAllOrders); // GET /api/v1/admin/orders

router
  .route("/orders/:id")
  .get(idParamValidation("id"), adminController.getAdminOrderById); // GET /api/v1/admin/orders/:id

router
  .route("/orders/:id/status")
  // Add specific validation for order status update if complex
  .patch(idParamValidation("id"), adminController.updateOrderStatus); // PATCH /api/v1/admin/orders/:id/status

// --- Dispute Management Routes ---
router
  .route("/disputes")
  .get(paginationValidation, adminController.getAllDisputes);

router
  .route("/disputes/:id")
  .get(idParamValidation("id"), adminController.getDisputeById)
  .patch(
    idParamValidation("id"),
    /* add disputeUpdateValidation */ adminController.updateDispute
  );

// --- Optional: Admin Dashboard Stats Route ---
// router.get('/dashboard/stats', adminController.getDashboardStats);

module.exports = router;
