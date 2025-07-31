'use strict';

const { 
  Order, 
  OrderItem, 
  Product, 
  User, 
  ShoppingCart,
  CartItem,
  sequelize 
} = require("../db");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const logger = require("../utils/logger");
const { 
  calculateOrderTotal, 
  validateStockAvailability, 
  updateProductStock 
} = require("../utils/orderUtils");

// Get all orders for the logged-in user
exports.getMyOrders = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const { count, rows: orders } = await Order.findAndCountAll({
    where: { customer_id: userId },
    include: [
      {
        model: OrderItem,
        as: "orderItems",
        include: [{ model: Product, as: "product" }],
      },
    ],
    order: [["createdAt", "DESC"]],
    offset: parseInt(offset),
    limit: parseInt(limit),
  });

  res.status(200).json({
    status: "success",
    results: orders.length,
    totalOrders: count,
    totalPages: Math.ceil(count / parseInt(limit, 10)),
    currentPage: parseInt(page, 10),
    data: { orders },
  });
});

// Create a new order from the user's cart
exports.createOrder = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  // Get user's cart with items
  const cart = await ShoppingCart.findOne({
    where: { customer_id: userId },
    include: [
      {
        model: CartItem,
        as: "items",
        include: [{ model: Product, as: "product" }],
      },
    ],
  });

  if (!cart || !cart.items.length) {
    return next(new AppError("Your cart is empty.", 400));
  }

  // Format order items and calculate total
  const orderItems = cart.items.map(item => ({
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.product.price // Use current product price
  }));

  const total = calculateOrderTotal(orderItems);

  // Start transaction
  const result = await sequelize.transaction(async (t) => {
    // Validate stock availability for all items
    await validateStockAvailability(orderItems, t);

    // Create order
    const order = await Order.create(
      {
        customer_id: userId,
        order_status: "pending_payment",
        total_amount: total,
        order_date: new Date()
      },
      { transaction: t }
    );

    // Create order items
    await OrderItem.bulkCreate(
      orderItems.map(item => ({
        order_id: order.id,
        ...item
      })), 
      { transaction: t }
    );

    // Update product stock quantities
    await updateProductStock(orderItems, t);

    // Clear cart
    await CartItem.destroy({
      where: { cart_id: cart.id },
      transaction: t
    });

    // Return order with items
    return await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: "orderItems",
          include: [{ model: Product, as: "product" }],
        },
      ],
      transaction: t,
    });
  });

  logger.info(`Order ${result.id} created for user ${userId}`);
  res.status(201).json({
    status: "success",
    data: { order: result },
  });
});

// Get a specific order by ID (must belong to user)
exports.getOrderById = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const orderId = req.params.id;

  const order = await Order.findOne({
    where: { id: orderId, customer_id: userId },
    include: [
      {
        model: OrderItem,
        as: "orderItems",
        include: [{ model: Product, as: "product" }],
      },
    ],
  });

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { order },
  });
});

// ADMIN: Get all orders (paginated, filterable)
exports.getAllOrders = catchAsync(async (req, res, next) => {
  // Only allow admin access (middleware should enforce)
  const { page = 1, limit = 10, status, userId, search } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const whereClause = {};
  if (status) whereClause.order_status = status;
  if (userId) whereClause.customer_id = userId;
  if (search && !isNaN(parseInt(search, 10))) {
    whereClause.id = parseInt(search, 10);
  }
  // ...existing code...
  const { count, rows: orders } = await Order.findAndCountAll({
    where: whereClause,
    include: [
      { model: User, as: "customer", attributes: ["id", "full_name", "email"] },
      {
        model: OrderItem,
        as: "orderItems",
        include: [
          { model: Product, as: "product", attributes: ["id", "name"] },
        ],
      },
    ],
    limit: parseInt(limit, 10),
    offset,
    order: [["createdAt", "DESC"]],
    distinct: true,
  });
  res.status(200).json({
    status: "success",
    results: orders.length,
    totalOrders: count,
    totalPages: Math.ceil(count / parseInt(limit, 10)),
    currentPage: parseInt(page, 10),
    data: { orders },
  });
});

// ADMIN: Update order status (and shipping info)
exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  // Only allow admin access (middleware should enforce)
  const orderId = req.params.id;
  const { order_status, shipping_status, tracking_number, carrier } = req.body;
  const order = await Order.findByPk(orderId, {
    include: [
      {
        model: require("../models/shipping")(
          Order.sequelize,
          Order.sequelize.Sequelize.DataTypes
        ),
        as: "shipping",
      },
    ],
  });
  if (!order) return next(new AppError("Order not found", 404));
  let updated = false;
  if (order_status && order.order_status !== order_status) {
    order.order_status = order_status;
    updated = true;
  }
  if (order.shipping) {
    if (shipping_status && order.shipping.shipping_status !== shipping_status) {
      order.shipping.shipping_status = shipping_status;
      updated = true;
    }
    if (tracking_number && order.shipping.tracking_number !== tracking_number) {
      order.shipping.tracking_number = tracking_number;
      updated = true;
    }
    if (carrier && order.shipping.carrier !== carrier) {
      order.shipping.carrier = carrier;
      updated = true;
    }
    if (updated) await order.shipping.save();
  }
  if (updated) await order.save();
  res
    .status(200)
    .json({ status: "success", message: "Order updated successfully." });
});

// Cancel order (customer)
exports.cancelOrder = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const orderId = req.params.id;
  const order = await Order.findOne({
    where: { id: orderId, customer_id: userId },
  });
  if (!order) return next(new AppError("Order not found", 404));
  if (order.order_status === "cancelled") {
    return next(new AppError("Order is already cancelled.", 400));
  }
  // Only allow cancellation if not shipped/delivered
  if (["shipped", "delivered"].includes(order.order_status)) {
    return next(
      new AppError(
        "Cannot cancel an order that is already shipped or delivered.",
        400
      )
    );
  }
  order.order_status = "cancelled";
  await order.save();
  res
    .status(200)
    .json({ status: "success", message: "Order cancelled successfully." });
});

// Get all orders for products sold by the current seller
exports.getSellerOrders = catchAsync(async (req, res, next) => {
  const sellerId = req.user.id;
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  // Step 1: Find all order IDs that have at least one OrderItem with a product sold by this seller
  const orderItemRows = await OrderItem.findAll({
    attributes: ["order_id"],
    include: [
      {
        model: Product,
        as: "product",
        where: { seller_id: sellerId },
        attributes: [],
      },
    ],
    group: ["order_id"],
    raw: true,
  });
  const orderIds = orderItemRows.map((row) => row.order_id);

  // Step 2: Fetch those orders with all details
  const { count, rows: orders } = await Order.findAndCountAll({
    where: { id: orderIds.length ? orderIds : null },
    include: [
      {
        model: OrderItem,
        as: "orderItems",
        include: [
          {
            model: Product,
            as: "product",
            // Only include products sold by this seller
            where: { seller_id: sellerId },
          },
        ],
      },
      { model: User, as: "customer", attributes: ["id", "full_name", "email"] },
    ],
    order: [["createdAt", "DESC"]],
    offset: parseInt(offset),
    limit: parseInt(limit),
    distinct: true,
  });

  // Calculate seller-specific totals for each order
  const ordersWithSellerTotals = orders.map(order => {
    const sellerTotal = order.orderItems.reduce((sum, item) => {
      const itemPrice = parseFloat(item.product?.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      return sum + (itemPrice * quantity);
    }, 0);

    return {
      ...order.toJSON(),
      seller_total: sellerTotal,
    };
  });

  res.status(200).json({
    status: "success",
    results: orders.length,
    totalOrders: count,
    totalPages: Math.ceil(count / parseInt(limit, 10)),
    currentPage: parseInt(page, 10),
    data: { orders: ordersWithSellerTotals },
  });
});
