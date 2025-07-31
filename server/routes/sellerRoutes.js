const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');

// Protect all routes - require authentication
router.use(protect);
// Restrict to seller role
router.use(restrictTo('seller'));

// Dashboard stats
router.get('/dashboard/stats', sellerController.getDashboardStats);

// Products
router.get('/products', sellerController.getSellerProducts);
router.post('/products', sellerController.createProduct);
router.patch('/products/:id', sellerController.updateProduct);
router.delete('/products/:id', sellerController.deleteProduct);

// Orders
router.get('/orders', sellerController.getSellerOrders);
router.patch('/orders/:id/status', sellerController.updateOrderStatus);

// Analytics
router.get('/analytics', sellerController.getAnalytics);

module.exports = router;
