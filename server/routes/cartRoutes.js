const express = require("express");
const cartController = require("../controllers/cartController");
const { protect } = require("../middleware/authMiddleware"); // Cart ops require login
const {
  cartItemAddValidation,
  cartItemUpdateValidation,
  idParamValidation,
} = require("../middleware/validationMiddleware");

const router = express.Router();

// All cart routes require user to be logged in
router.use(protect); // Apply protect middleware to all routes below

router.route("/").get(cartController.getCart).delete(cartController.clearCart); // Clear the entire cart

router
  .route("/items")
  .post(cartItemAddValidation, cartController.addItemToCart); // Add item

router
  .route("/items/:itemId")
  .patch(cartItemUpdateValidation, cartController.updateCartItem) // Update quantity
  .delete(idParamValidation("itemId"), cartController.removeCartItem); // Remove item

module.exports = router;
