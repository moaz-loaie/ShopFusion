const { ShoppingCart, CartItem, Product, sequelize } = require("../db");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");

// Helper function to get or create a cart for the user
const getOrCreateCart = async (userId) => {
  let cart = await ShoppingCart.findOne({ where: { customer_id: userId } });
  if (!cart) {
    logger.info(`Creating new shopping cart for User ${userId}`);
    cart = await ShoppingCart.create({ customer_id: userId });
  }
  return cart;
};

// Helper function to fetch cart details with items and product info
const getCartDetails = async (cartId) => {
  return await ShoppingCart.findByPk(cartId, {
    include: [
      {
        model: CartItem,
        as: "items",
        required: false, // Use left join to get cart even if empty
        include: [
          {
            model: Product,
            as: "product",
            attributes: [
              "id",
              "name",
              "price",
              "preview_image_url",
              "stock_quantity",
            ], // Select needed product fields
          },
        ],
      },
    ],
    order: [[{ model: CartItem, as: "items" }, "createdAt", "ASC"]], // Order items by addition time
  });
};

// GET /api/v1/cart - Get the current user's cart
exports.getCart = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const cartInstance = await getOrCreateCart(userId);
  const cartDetails = await getCartDetails(cartInstance.id);

  // Calculate total (can also be done in DB or as a virtual field)
  let subtotal = 0;
  if (cartDetails && cartDetails.items) {
    subtotal = cartDetails.items.reduce((sum, item) => {
      // Ensure item.product exists and has a price
      const price = item.product?.price ?? 0;
      return sum + item.quantity * price;
    }, 0);
  }

  // Format the response
  const responseCart = {
    id: cartDetails?.id,
    items:
      cartDetails?.items?.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unit_price: item.product?.price, // Price at the time of viewing
        product: item.product
          ? {
              // Avoid sending full product object if null
              id: item.product.id,
              name: item.product.name,
              price: item.product.price,
              preview_image_url: item.product.preview_image_url,
              stock_quantity: item.product.stock_quantity, // Useful for display warnings
            }
          : null,
      })) || [],
    subtotal: parseFloat(subtotal.toFixed(2)), // Ensure 2 decimal places
    // Add other calculated fields like discounts, estimated tax later if needed
  };

  res.status(200).json({
    status: "success",
    data: {
      cart: responseCart,
    },
  });
});

// POST /api/v1/cart/items - Add an item to the cart
exports.addItemToCart = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { productId, quantity } = req.body;

  const cart = await getOrCreateCart(userId);

  // Check if product exists and has sufficient stock
  const product = await Product.findByPk(productId, {
    attributes: ["id", "stock_quantity", "price"],
  });
  if (!product) {
    return next(new AppError("Product not found", 404));
  }
  if (product.stock_quantity < quantity) {
    return next(
      new AppError(
        `Insufficient stock for ${product.name}. Only ${product.stock_quantity} available.`,
        400
      )
    );
  }

  // Check if item already exists in cart
  let cartItem = await CartItem.findOne({
    where: { cart_id: cart.id, product_id: productId },
  });

  if (cartItem) {
    // Update quantity if item exists
    const newQuantity = cartItem.quantity + quantity;
    if (product.stock_quantity < newQuantity) {
      return next(
        new AppError(
          `Cannot add ${quantity} more. Insufficient stock for ${product.name}. Total available: ${product.stock_quantity}.`,
          400
        )
      );
    }
    cartItem.quantity = newQuantity;
    await cartItem.save();
    logger.info(
      `Updated quantity for Product ${productId} in Cart ${cart.id} for User ${userId}. New quantity: ${newQuantity}`
    );
  } else {
    // Create new cart item if it doesn't exist
    cartItem = await CartItem.create({
      cart_id: cart.id,
      product_id: productId,
      quantity: quantity,
      unit_price: product.price, // Store price at time of adding (optional)
    });
    logger.info(
      `Added Product ${productId} (Qty: ${quantity}) to Cart ${cart.id} for User ${userId}`
    );
  }

  // Fetch updated cart details to return
  const updatedCartDetails = await getCartDetails(cart.id);
  // Calculate total again (could be simplified)
  let subtotal = 0;
  if (updatedCartDetails && updatedCartDetails.items) {
    subtotal = updatedCartDetails.items.reduce((sum, item) => {
      const price = item.product?.price ?? 0;
      return sum + item.quantity * price;
    }, 0);
  }

  const responseCart = {
    id: updatedCartDetails?.id,
    items:
      updatedCartDetails?.items?.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unit_price: item.product?.price,
        product: item.product
          ? {
              id: item.product.id,
              name: item.product.name,
              price: item.product.price,
              preview_image_url: item.product.preview_image_url,
              stock_quantity: item.product.stock_quantity,
            }
          : null,
      })) || [],
    subtotal: parseFloat(subtotal.toFixed(2)),
  };

  res.status(200).json({
    // 200 OK as cart state is returned
    status: "success",
    message: "Item added to cart successfully.",
    data: {
      cart: responseCart,
    },
  });
});

// PATCH /api/v1/cart/items/:itemId - Update item quantity in cart
exports.updateCartItem = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const itemId = req.params.itemId;
  const { quantity } = req.body; // Assumes quantity is the new total quantity

  const cart = await ShoppingCart.findOne({ where: { customer_id: userId } });
  if (!cart) {
    return next(new AppError("Shopping cart not found.", 404));
  }

  const cartItem = await CartItem.findOne({
    where: { id: itemId, cart_id: cart.id }, // Ensure item belongs to user's cart
    include: [
      {
        model: Product,
        as: "product",
        attributes: ["id", "stock_quantity", "name"],
      },
    ],
  });

  if (!cartItem) {
    return next(new AppError("Cart item not found.", 404));
  }

  // Check stock for the *new* total quantity
  if (!cartItem.product) {
    return next(
      new AppError("Associated product not found for this cart item.", 404)
    ); // Data integrity issue
  }
  if (cartItem.product.stock_quantity < quantity) {
    return next(
      new AppError(
        `Insufficient stock for ${cartItem.product.name}. Only ${cartItem.product.stock_quantity} available.`,
        400
      )
    );
  }

  // Update quantity
  cartItem.quantity = quantity;
  await cartItem.save();

  logger.info(
    `Updated CartItem ${itemId} quantity to ${quantity} in Cart ${cart.id} for User ${userId}`
  );

  // Fetch and return updated cart
  const updatedCartDetails = await getCartDetails(cart.id);
  let subtotal = 0;
  if (updatedCartDetails && updatedCartDetails.items) {
    subtotal = updatedCartDetails.items.reduce((sum, item) => {
      const price = item.product?.price ?? 0;
      return sum + item.quantity * price;
    }, 0);
  }
  const responseCart = {
    id: updatedCartDetails?.id,
    items:
      updatedCartDetails?.items?.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unit_price: item.product?.price,
        product: item.product
          ? {
              id: item.product.id,
              name: item.product.name,
              price: item.product.price,
              preview_image_url: item.product.preview_image_url,
              stock_quantity: item.product.stock_quantity,
            }
          : null,
      })) || [],
    subtotal: parseFloat(subtotal.toFixed(2)),
  };

  res.status(200).json({
    status: "success",
    message: "Cart item updated successfully.",
    data: {
      cart: responseCart,
    },
  });
});

// DELETE /api/v1/cart/items/:itemId - Remove an item from the cart
exports.removeCartItem = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const itemId = req.params.itemId;

  const cart = await ShoppingCart.findOne({ where: { customer_id: userId } });
  if (!cart) {
    // If no cart, the item can't exist anyway, but maybe return 404 for consistency
    return next(new AppError("Shopping cart not found.", 404));
  }

  const deleteCount = await CartItem.destroy({
    where: {
      id: itemId,
      cart_id: cart.id, // Ensure item belongs to the user's cart
    },
  });

  if (deleteCount === 0) {
    return next(
      new AppError("Cart item not found or does not belong to your cart.", 404)
    );
  }

  logger.info(
    `Removed CartItem ${itemId} from Cart ${cart.id} for User ${userId}`
  );

  // Fetch and return updated cart
  const updatedCartDetails = await getCartDetails(cart.id);
  let subtotal = 0;
  if (updatedCartDetails && updatedCartDetails.items) {
    subtotal = updatedCartDetails.items.reduce((sum, item) => {
      const price = item.product?.price ?? 0;
      return sum + item.quantity * price;
    }, 0);
  }
  const responseCart = {
    id: updatedCartDetails?.id,
    items:
      updatedCartDetails?.items?.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unit_price: item.product?.price,
        product: item.product
          ? {
              id: item.product.id,
              name: item.product.name,
              price: item.product.price,
              preview_image_url: item.product.preview_image_url,
              stock_quantity: item.product.stock_quantity,
            }
          : null,
      })) || [],
    subtotal: parseFloat(subtotal.toFixed(2)),
  };

  res.status(200).json({
    // Return 200 with updated cart state
    status: "success",
    message: "Item removed from cart successfully.",
    data: {
      cart: responseCart,
    },
  });
});

// DELETE /api/v1/cart - Clear the entire cart (Optional Endpoint)
exports.clearCart = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const cart = await ShoppingCart.findOne({ where: { customer_id: userId } });

  if (cart) {
    const deleteCount = await CartItem.destroy({ where: { cart_id: cart.id } });
    logger.info(
      `Cleared ${deleteCount} items from Cart ${cart.id} for User ${userId}`
    );
  } else {
    logger.info(
      `Attempted to clear cart for User ${userId}, but no cart found.`
    );
  }

  // Return an empty cart structure
  const responseCart = { id: cart?.id, items: [], subtotal: 0 };

  res.status(200).json({
    status: "success",
    message: "Cart cleared successfully.",
    data: {
      cart: responseCart,
    },
  });
});
