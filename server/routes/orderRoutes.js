const express = require("express");
const orderController = require("../controllers/orderController");
const { protect, restrictTo } = require("../middleware/authMiddleware");
const { paginationMiddleware } = require("../middleware/paginationMiddleware");
const {  orderCreateValidation,
  idParamValidation,
} = require("../middleware/validationMiddleware");

const router = express.Router();

// All order routes require user to be logged in
router.use(protect);

router  .route("/")
  .get(paginationMiddleware(10, 50), orderController.getMyOrders) // Get orders for the logged-in user
  .post(orderCreateValidation, orderController.createOrder); // Create a new order from cart

// Seller: Get all orders for products sold by the current seller
router.get("/seller", paginationMiddleware(10, 50), orderController.getSellerOrders);

// Route for a specific order
router.route("/:id").get(idParamValidation("id"), orderController.getOrderById); // Get details of a specific order (check ownership in controller)

// Optional: Route for cancelling an order (if implemented)
// router.patch('/:id/cancel', idParamValidation('id'), orderController.cancelOrder);

// Optional: Admin routes for managing all orders (might go in adminRoutes.js)
// router.get('/admin/all', restrictTo('admin'), paginationMiddleware(10, 50), orderController.getAllOrders);
// router.patch('/admin/:id/status', restrictTo('admin'), idParamValidation('id'), orderController.updateOrderStatus);

module.exports = router;
