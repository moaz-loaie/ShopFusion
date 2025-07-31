const {
  User,
  Product,
  ProductCategory,
  Order,
  OrderItem,
  Review,
  ModerationQueue,
  Dispute,
  sequelize,
} = require("../db");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");
const { getTimeElapsed, formatDate } = require("../utils/dateUtils");
const { Op, Sequelize } = require("sequelize");

// --- User Management ---

// GET /api/v1/admin/users - List all users with pagination and filtering
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, role, search } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const whereClause = {};
  if (role) whereClause.role = role;
  if (search) {
    whereClause[Op.or] = [      { full_name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows: users } = await User.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit, 10),
    offset,
    order: [["createdAt", "DESC"]],
    // Exclude password_hash, even though toJSON handles it, good practice at query level
    attributes: { exclude: ["password_hash"] },
  });

  logger.debug(
    `Admin retrieved ${users.length} users out of ${count}. Page: ${page}, Limit: ${limit}`
  );
  res.status(200).json({
    status: "success",
    results: users.length,
    totalUsers: count,
    totalPages: Math.ceil(count / parseInt(limit, 10)),
    currentPage: parseInt(page, 10),
    data: { users },
  });
});

// GET /api/v1/admin/users/:id - Get a specific user by ID
exports.getUserById = catchAsync(async (req, res, next) => {
  const userId = req.params.id;
  const user = await User.findByPk(userId, {
    attributes: { exclude: ["password_hash"] },
    // Optional: include related data like orders, products (for sellers)
    // include: [
    //     { model: Order, as: 'orders', limit: 5, order: [['createdAt', 'DESC']] },
    // ]
  });

  if (!user) {
    logger.warn(`Admin: User with ID ${userId} not found.`);
    return next(new AppError("User not found", 404));
  }

  logger.debug(`Admin retrieved user details for ID: ${userId}`);
  res.status(200).json({ status: "success", data: { user } });
});

// PATCH /api/v1/admin/users/:id - Update a user (e.g., role, status)
exports.updateUser = catchAsync(async (req, res, next) => {
  const userId = req.params.id;
  const { full_name, email, role /*, is_active, etc. */ } = req.body;

  // Fields an admin can update
  const allowedUpdates = {};
  if (full_name !== undefined) allowedUpdates.full_name = full_name;
  if (email !== undefined) allowedUpdates.email = email; // Ensure email uniqueness is handled by DB/model
  if (role !== undefined) allowedUpdates.role = role;
  // if (is_active !== undefined) allowedUpdates.is_active = is_active; // If using an active flag

  if (Object.keys(allowedUpdates).length === 0) {
    return next(new AppError("No valid fields provided for update.", 400));
  }

  const user = await User.findByPk(userId);
  if (!user) {
    logger.warn(`Admin: Attempted to update non-existent User ID: ${userId}`);
    return next(new AppError("User not found", 404));
  }

  // Prevent admin from accidentally making themselves a non-admin if they are the only one
  if (
    user.id === req.user.id &&
    allowedUpdates.role &&
    allowedUpdates.role !== "admin"
  ) {
    const adminCount = await User.count({ where: { role: "admin" } });
    if (adminCount <= 1) {
      logger.warn(
        `Admin ${user.id} attempted to change their own role while being the only admin.`
      );
      return next(
        new AppError("Cannot change the role of the last remaining admin.", 403)
      );
    }
  }

  // Update the user
  await user.update(allowedUpdates);
  // Note: If password reset is needed, it should be a separate, secure process.
  // Avoid directly setting password_hash here unless carefully handled.

  const updatedUser = await User.findByPk(userId, {
    attributes: { exclude: ["password_hash"] },
  }); // Refetch to get clean data

  logger.info(
    `Admin ${req.user.id} updated User ID: ${userId}. Changes: ${JSON.stringify(
      allowedUpdates
    )}`
  );
  res.status(200).json({ status: "success", data: { user: updatedUser } });
});

// DELETE /api/v1/admin/users/:id - Delete a user (soft delete recommended)
exports.deleteUser = catchAsync(async (req, res, next) => {
  const userId = req.params.id;

  const user = await User.findByPk(userId);
  if (!user) {
    logger.warn(`Admin: Attempted to delete non-existent User ID: ${userId}`);
    return next(new AppError("User not found", 404));
  }

  // Prevent admin from deleting themselves
  if (user.id === req.user.id) {
    logger.warn(`Admin ${user.id} attempted to delete their own account.`);
    return next(
      new AppError("Administrators cannot delete their own account.", 403)
    );
  }

  // Business decision: What happens to user's content?
  // - Soft delete: Add a 'deletedAt' field (paranoid mode in Sequelize)
  // - Hard delete: user.destroy()
  // - Anonymize: Replace PII with generic values.
  // For simplicity, this is a hard delete. Consider soft delete in production.
  await user.destroy();
  // Note: onDelete 'CASCADE' or 'SET NULL' in model associations will handle related data.

  logger.info(`Admin ${req.user.id} deleted User ID: ${userId}.`);
  res.status(204).json({ status: "success", data: null });
});

// --- Product Moderation ---

// GET /api/v1/admin/products/moderation - List products awaiting moderation or all w/ status
exports.getProductsForModeration = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, status = "pending", seller_id } = req.query; // Added seller_id to query params
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const whereClause = {};
  // Add status filter
  if (status && ["pending", "approved", "rejected"].includes(status)) {
    whereClause.status = status;
  }

  // Join conditions
  const include = [
    {
      model: Product,
      as: "product",
      include: [
        {
          model: User,
          as: "Seller",
          attributes: ["id", "full_name", "email"],
        },
      ],
    },
    { model: User, as: "adminReviewer", attributes: ["id", "full_name"] },
  ];

  // Add seller filter
  if (seller_id) {
    const sellerId = parseInt(seller_id, 10);
    if (!isNaN(sellerId)) {
      include[0].where = { seller_id: sellerId };
    }
  }

  const { count, rows: moderationItems } =
    await ModerationQueue.findAndCountAll({
      where: whereClause,
      include,
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit, 10),
      offset,
      distinct: true, // Needed for accurate count with includes
    });

  logger.debug(
    `Admin retrieved ${moderationItems.length} moderation items. Status: ${status}${seller_id ? `, Seller: ${seller_id}` : ''}`
  );
  
  res.status(200).json({
    status: "success",
    results: moderationItems.length,
    totalItems: count,
    totalPages: Math.ceil(count / parseInt(limit, 10)),
    currentPage: parseInt(page, 10),
    data: { moderationItems },
  });
});

// PATCH /api/v1/admin/products/moderation/:moderationId - Approve or reject a product
exports.moderateProduct = catchAsync(async (req, res, next) => {
  const moderationId = req.params.moderationId; // This is ID of ModerationQueue entry
  const adminId = req.user.id;
  const { status, feedback } = req.body; // 'approved' or 'rejected'

  const moderationEntry = await ModerationQueue.findByPk(moderationId, {
    include: [{ model: Product, as: "product" }],
  });

  if (!moderationEntry) {
    logger.warn(
      `Admin ${adminId} - Moderation entry ${moderationId} not found.`
    );
    return next(new AppError("Moderation entry not found.", 404));
  }
  if (!moderationEntry.product) {
    logger.error(
      `Admin ${adminId} - Product associated with Moderation entry ${moderationId} not found (data integrity issue).`
    );
    return next(
      new AppError("Associated product not found. Cannot moderate.", 500)
    );
  }

  // Update moderation queue
  moderationEntry.status = status;
  moderationEntry.feedback = feedback || null; // Allow null feedback if not provided (e.g., for approval)
  moderationEntry.admin_id = adminId;
  moderationEntry.reviewed_at = new Date();
  await moderationEntry.save();

  // ...existing code...
  // For now, we assume the ModerationQueue table is the source of truth for moderated status.
  // Example if Product model has a 'moderation_status' field:
  // await Product.update({ moderation_status: status }, { where: { id: moderationEntry.product_id } });

  logger.info(
    `Admin ${adminId} moderated Product ID ${moderationEntry.product_id} (Queue ID: ${moderationId}) to status: ${status}.`
  );

  // ...existing code...
  // (e.g., using an email service or internal notification system)

  res.status(200).json({
    status: "success",
    message: `Product moderation status updated to ${status}.`,
    data: { moderationEntry },
  });
});

// PATCH /api/v1/admin/products/moderation/:moderationId/feedback - Update feedback only
exports.updateModerationFeedback = catchAsync(async (req, res, next) => {
  const moderationId = req.params.moderationId;
  const adminId = req.user.id;
  const { feedback } = req.body;

  if (!feedback) {
    return next(new AppError("Feedback is required", 400));
  }

  const moderationEntry = await ModerationQueue.findByPk(moderationId);
  if (!moderationEntry) {
    logger.warn(
      `Admin ${adminId} - Moderation entry ${moderationId} not found.`
    );
    return next(new AppError("Moderation entry not found.", 404));
  }

  moderationEntry.feedback = feedback.trim();
  moderationEntry.admin_id = adminId;
  moderationEntry.reviewed_at = new Date();
  await moderationEntry.save();
  logger.info(
    `Admin ${adminId} updated feedback for Moderation entry ${moderationId}.`
  );
  res.status(200).json({ status: "success", data: { moderationEntry } });
});

// --- Order Management ---
// GET /api/v1/admin/orders - List all orders (paginated, filterable)
exports.getAllOrders = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, status, userId, search } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const whereClause = {};
  if (status) whereClause.order_status = status;
  if (userId) whereClause.customer_id = userId;
  // More complex search needed if searching across customer name, product names in order etc.
  // For simplicity, this search might target order ID (if numeric) or customer details
  if (search && !isNaN(parseInt(search, 10))) {
    whereClause.id = parseInt(search, 10);
  } else if (search) {
    // Example search on user email (requires join)
    // This demonstrates a more complex include/where for search
  }

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
    order: [["order_date", "DESC"]], // Show newest orders first
    distinct: true, // Important for count with includes
  });

  logger.debug(`Admin retrieved ${orders.length} orders out of ${count}.`);
  res.status(200).json({
    status: "success",
    results: orders.length,
    totalOrders: count,
    totalPages: Math.ceil(count / parseInt(limit, 10)),
    currentPage: parseInt(page, 10),
    data: { orders },
  });
});

// GET /api/v1/admin/orders/:id - Get a specific order by ID (admin view)
exports.getAdminOrderById = catchAsync(async (req, res, next) => {
  const orderId = req.params.id;
  const order = await Order.findByPk(orderId, {
    include: [
      { model: User, as: "customer", attributes: ["id", "full_name", "email"] },
      {
        model: OrderItem,
        as: "orderItems",
        include: [
          { model: Product, as: "product" /* attributes selected as needed */ },
        ],
      },
      { model: Payment, as: "payment" },
      { model: Shipping, as: "shipping" },
    ],
  });

  if (!order) {
    logger.warn(`Admin: Order with ID ${orderId} not found.`);
    return next(new AppError("Order not found", 404));
  }

  logger.debug(`Admin retrieved order details for ID: ${orderId}`);
  res.status(200).json({ status: "success", data: { order } });
});

// PATCH /api/v1/admin/orders/:id/status - Update order status
exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  const orderId = req.params.id;
  const adminId = req.user.id;
  const { order_status, shipping_status, tracking_number, carrier } = req.body; // Admin can update these

  const order = await Order.findByPk(orderId, {
    include: [{ model: Shipping, as: "shipping" }],
  });
  if (!order) {
    logger.warn(
      `Admin ${adminId}: Order with ID ${orderId} not found for status update.`
    );
    return next(new AppError("Order not found", 404));
  }

  let updated = false;
  const changes = {};

  if (order_status && order.order_status !== order_status) {
    // Validate new order_status against ENUM values
    const validOrderStatuses = Order.getAttributes().order_status.values;
    if (!validOrderStatuses.includes(order_status)) {
      return next(new AppError(`Invalid order status: ${order_status}`, 400));
    }
    order.order_status = order_status;
    changes.order_status = order_status;
    updated = true;

    // If order is shipped, update shipped_date in Shipping record
    if (order_status === "shipped" && order.shipping) {
      if (!order.shipping.shipped_date)
        order.shipping.shipped_date = new Date();
      if (shipping_status && shipping_status !== order.shipping.shipping_status)
        order.shipping.shipping_status = shipping_status;
      else if (
        !order.shipping.shipping_status ||
        order.shipping.shipping_status === "processing"
      )
        order.shipping.shipping_status = "shipped";

      if (tracking_number) order.shipping.tracking_number = tracking_number;
      if (carrier) order.shipping.carrier = carrier;
      await order.shipping.save();
      changes.shipping_details = "updated";
    }
  }

  // Update shipping specific details if provided
  if (order.shipping && (shipping_status || tracking_number || carrier)) {
    if (shipping_status && order.shipping.shipping_status !== shipping_status) {
      const validShippingStatuses =
        Shipping.getAttributes().shipping_status.values;
      if (!validShippingStatuses.includes(shipping_status)) {
        return next(
          new AppError(`Invalid shipping status: ${shipping_status}`, 400)
        );
      }
      order.shipping.shipping_status = shipping_status;
      changes.shipping_status = shipping_status;
      updated = true;
    }
    if (
      tracking_number !== undefined &&
      order.shipping.tracking_number !== tracking_number
    ) {
      order.shipping.tracking_number = tracking_number;
      changes.tracking_number = tracking_number;
      updated = true;
    }
    if (carrier !== undefined && order.shipping.carrier !== carrier) {
      order.shipping.carrier = carrier;
      changes.carrier = carrier;
      updated = true;
    }
    if (updated) await order.shipping.save(); // Save shipping only if changes were made to it
  }

  if (updated) {
    await order.save();
    logger.info(
      `Admin ${adminId} updated Order ID ${orderId}. Changes: ${JSON.stringify(
        changes
      )}`
    );
    // ...existing code...
  } else {
    logger.info(`Admin ${adminId}: No changes applied to Order ID ${orderId}.`);
    return res.status(200).json({
      status: "success",
      message: "No changes applied.",
      data: { order },
    });
  }

  const updatedOrder = await Order.findByPk(orderId, {
    include: [
      { model: Shipping, as: "shipping" },
      { model: User, as: "customer", attributes: ["id", "email"] },
    ],
  }); // Refetch

  res.status(200).json({
    status: "success",
    message: "Order status updated successfully.",
    data: { order: updatedOrder },
  });
});

// --- Dispute Management (Basic Structure) ---
// GET /api/v1/admin/disputes
exports.getAllDisputes = catchAsync(async (req, res, next) => {  const { page = 1, limit = 10, status, orderId, userId, priority, timePeriod } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const whereClause = {};
  
  // Status filter
  if (status) whereClause.status = status;
  
  // Priority filter
  if (priority) whereClause.priority = priority;
  
  // Time period filter
  if (timePeriod) {
    const today = new Date();
    switch(timePeriod) {
      case 'today':
        whereClause.createdAt = { [Op.gte]: new Date(today.setHours(0,0,0,0)) };
        break;
      case 'week':
        whereClause.createdAt = { [Op.gte]: new Date(today.setDate(today.getDate() - 7)) };
        break;
      case 'month':
        whereClause.createdAt = { [Op.gte]: new Date(today.setMonth(today.getMonth() - 1)) };
        break;
    }
  }

  // Other filters
  if (orderId) whereClause.order_id = orderId;
  if (userId) whereClause.raised_by_user_id = userId;

  const { count, rows: disputes } = await Dispute.findAndCountAll({
    where: whereClause,
    include: [
      { model: Order, as: "order", attributes: ["id", "order_date"] },
      { model: User, as: "raisedBy", attributes: ["id", "full_name", "email"] },
      { model: User, as: "resolver", attributes: ["id", "full_name"] },
    ],    order: [
      ['priority', 'DESC'],
      ['createdAt', 'DESC']
    ],
    limit: parseInt(limit, 10),
    offset,
    distinct: true,
  });

  // Format disputes for response
  const formattedDisputes = disputes.map(dispute => ({
    ...dispute.toJSON(),
    timeElapsed: getTimeElapsed(dispute.createdAt),
    resolvedTimeElapsed: dispute.resolved_at ? getTimeElapsed(dispute.resolved_at) : null
  }));

  res.status(200).json({
    status: "success",
    results: disputes.length,
    totalItems: count,
    data: { disputes: formattedDisputes },
  });
});

// GET /api/v1/admin/disputes/:id
exports.getDisputeById = catchAsync(async (req, res, next) => {
  const dispute = await Dispute.findByPk(req.params.id, {
    include: [
      {
        model: Order,
        as: "order",
        include: [
          {
            model: User,
            as: "customer",
            attributes: ["id", "full_name", "email"],
          },
        ],
      },
      { model: User, as: "raisedBy", attributes: ["id", "full_name", "email"] },
      { model: User, as: "resolver", attributes: ["id", "full_name"] },
    ],
  });
  if (!dispute) return next(new AppError("Dispute not found", 404));
  res.status(200).json({ status: "success", data: { dispute } });
});

// PATCH /api/v1/admin/disputes/:id
exports.updateDispute = catchAsync(async (req, res, next) => {
  const adminId = req.user.id;
  const { status, resolution_details } = req.body;
  const dispute = await Dispute.findByPk(req.params.id);
  if (!dispute) return next(new AppError("Dispute not found", 404));

  const allowedUpdates = {};
  if (
    status &&
    ["open", "resolved", "rejected", "under_review"].includes(status)
  ) {
    allowedUpdates.status = status;
    if (["resolved", "rejected"].includes(status)) {
      allowedUpdates.resolved_at = new Date();
      allowedUpdates.resolved_by_user_id = adminId;
    }
  }
  if (resolution_details !== undefined)
    allowedUpdates.resolution_details = resolution_details;

  if (Object.keys(allowedUpdates).length === 0) {
    return next(
      new AppError("No valid fields provided for dispute update.", 400)
    );
  }

  await dispute.update(allowedUpdates);
  logger.info(
    `Admin ${adminId} updated Dispute ID ${
      dispute.id
    }. Changes: ${JSON.stringify(allowedUpdates)}`
  );
  // TODO: Notify user about dispute status change
  res.status(200).json({ status: "success", data: { dispute } });
});

// --- Seller Management ---
exports.getAllSellers = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    sortBy = 'createdAt',
    sortOrder = 'DESC'
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  const whereClause = {
    role: 'seller'
  };

  // Add search filter
  if (search) {
    whereClause[Op.or] = [
      { full_name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
      { store_name: { [Op.iLike]: `%${search}%` } }
    ];
  }

  // Add status filter
  if (status === 'active') {
    whereClause.is_active = true;
    whereClause.last_login_at = {
      [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
    };
  } else if (status === 'inactive') {
    whereClause[Op.or] = [
      { is_active: false },
      {
        last_login_at: {
          [Op.lt]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    ];
  }

  const { count, rows: sellers } = await User.findAndCountAll({
    where: whereClause,
    attributes: {
      exclude: ['password_hash'],
      include: [
        [
          Sequelize.literal(`(
            SELECT COUNT(*)::integer
            FROM products
            WHERE products.seller_id = "User".id
            AND products.is_active = true
          )`),
          'total_products'
        ],
        [
          Sequelize.literal(`(
            SELECT COALESCE(SUM(orders.total_amount), 0)::float
            FROM orders
            INNER JOIN order_items ON orders.id = order_items.order_id
            INNER JOIN products ON order_items.product_id = products.id
            WHERE products.seller_id = "User".id
            AND orders.status = 'completed'
          )`),
          'total_sales'
        ]
      ]
    },
    limit: parseInt(limit),
    offset,
    order: [[sortBy, sortOrder]],
    raw: true
  });

  res.status(200).json({
    status: 'success',
    results: sellers.length,
    totalSellers: count,
    totalPages: Math.ceil(count / parseInt(limit)),
    currentPage: parseInt(page),
    data: { sellers }
  });
});

// PATCH /api/v1/admin/sellers/:id/status - Update seller status
exports.updateSellerStatus = catchAsync(async (req, res, next) => {
  const sellerId = req.params.id;
  const { is_active } = req.body;
  const adminId = req.user.id;

  // Find the seller
  const seller = await User.findOne({ 
    where: { id: sellerId, role: 'seller' }
  });

  if (!seller) {
    logger.warn(`Admin ${adminId}: Seller with ID ${sellerId} not found for status update.`);
    return next(new AppError('Seller not found', 404));
  }

  // Update status
  seller.is_active = is_active;
  await seller.save();

  logger.info(
    `Admin ${adminId} updated Seller ${sellerId} status to ${is_active ? 'active' : 'inactive'}`
  );

  // If deactivating, also update all their products to inactive
  if (!is_active) {
    await Product.update(
      { is_active: false },
      { where: { seller_id: sellerId } }
    );
    logger.info(`All products for Seller ${sellerId} set to inactive`);
  }

  res.status(200).json({
    status: 'success',
    message: `Seller ${is_active ? 'activated' : 'deactivated'} successfully`,
    data: {
      seller: {
        id: seller.id,
        full_name: seller.full_name,
        email: seller.email,
        is_active: seller.is_active
      }
    }
  });
});

// --- System Settings ---
exports.getSystemSettings = catchAsync(async (req, res, next) => {
  // In a real app, these would be stored in a database
  // For now, we're returning default values
  const settings = {
    maintenance_mode: false,
    allow_guest_checkout: true,
    auto_approve_products: false,
    min_order_amount: 10,
    max_products_per_seller: 100,
    default_commission_rate: 10,
    max_images_per_product: 8,
    enable_reviews: true,
    require_email_verification: true,
    notification_email: "admin@shopfusion.com",
  };

  res.status(200).json({
    status: "success",
    data: { settings },
  });
});

exports.updateSystemSettings = catchAsync(async (req, res, next) => {
  const settings = req.body;

  // Validate required fields
  if (!settings) {
    return next(new AppError("No settings provided", 400));
  }

  // In a real app, these would be stored in a database
  // For now, we'll just return the updated settings
  logger.info("System settings updated:", settings);

  res.status(200).json({
    status: "success",
    message: "Settings updated successfully",
    data: { settings },
  });
});

// --- Dashboard Stats ---
// GET /api/v1/admin/dashboard/stats - Comprehensive admin dashboard statistics
exports.getDashboardStats = catchAsync(async (req, res, next) => {
  const [
    sellerStats,
    productStats,
    orderStats,
    disputeStats,
    revenueStats
  ] = await Promise.all([
    // Seller statistics
    User.findAll({
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total'],
        [Sequelize.literal(`
          SUM(CASE 
            WHEN is_active = true AND role = 'seller' 
            AND last_login_at >= NOW() - INTERVAL '30 days' 
            THEN 1 ELSE 0 END)`), 'active'],
        [Sequelize.literal(`
          SUM(CASE 
            WHEN role = 'seller' 
            AND created_at >= NOW() - INTERVAL '7 days' 
            THEN 1 ELSE 0 END)`), 'newLastWeek']
      ],
      where: { role: 'seller', deletedAt: null },
      raw: true
    }),

    // Product statistics
    Product.findAll({
      attributes: [
        [Sequelize.col('ModerationQueue.status'), 'status'],
        [Sequelize.fn('COUNT', Sequelize.col('Product.id')), 'count'],
        [Sequelize.literal(`
          SUM(CASE 
            WHEN stock_quantity <= low_stock_threshold 
            THEN 1 ELSE 0 END)`), 'lowStock']
      ],
      include: [{
        model: ModerationQueue,
        attributes: [],
        required: true
      }],
      group: ['ModerationQueue.status'],
      raw: true
    }),

    // Order statistics
    Order.findAll({
      attributes: [
        ['order_status', 'status'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'total_amount']
      ],
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      group: ['order_status'],
      raw: true
    }),

    // Dispute statistics
    Dispute.findAll({
      attributes: [
        ['status', 'status'],
        ['priority', 'priority'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.literal(`
          AVG(CASE 
            WHEN status = 'resolved' 
            THEN EXTRACT(EPOCH FROM (resolved_at - created_at))/86400.0 
            ELSE NULL END)`), 'avg_resolution_time']
      ],
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      group: ['status', 'priority'],
      raw: true
    }),

    // Revenue statistics
    Order.findAll({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'total'],
        [Sequelize.literal(`
          SUM(CASE 
            WHEN created_at >= NOW() - INTERVAL '7 days' 
            THEN total_amount ELSE 0 END)`), 'lastWeek'],
        [Sequelize.literal(`
          SUM(CASE 
            WHEN created_at >= NOW() - INTERVAL '14 days' 
            AND created_at < NOW() - INTERVAL '7 days'
            THEN total_amount ELSE 0 END)`), 'previousWeek']
      ],
      where: {
        order_status: { [Op.ne]: 'cancelled' }
      },
      raw: true
    })
  ]);

  // Process seller stats
  const sellers = {
    total: parseInt(sellerStats[0]?.total || 0),
    active: parseInt(sellerStats[0]?.active || 0),
    pending: parseInt(sellerStats[0]?.total || 0) - parseInt(sellerStats[0]?.active || 0),
    newLastWeek: parseInt(sellerStats[0]?.newLastWeek || 0)
  };
  
  // Process product stats
  const products = productStats.reduce((acc, stat) => {
    if (stat.status) {
      acc[stat.status] = parseInt(stat.count || 0);
    }
    acc.lowStock = parseInt(stat.lowStock || 0);
    return acc;
  }, { total: productStats.reduce((sum, stat) => sum + parseInt(stat.count || 0), 0) });

  // Process revenue stats
  const revenue = {
    total: parseFloat(revenueStats[0]?.total || 0),
    lastWeek: parseFloat(revenueStats[0]?.lastWeek || 0),
    previousWeek: parseFloat(revenueStats[0]?.previousWeek || 0),
    growth: revenueStats[0]?.previousWeek 
      ? ((revenueStats[0].lastWeek - revenueStats[0].previousWeek) / revenueStats[0].previousWeek * 100)
      : 0
  };

  // Process dispute stats
  const disputes = {
    total: disputeStats.reduce((sum, stat) => sum + parseInt(stat.count || 0), 0),
    open: disputeStats.filter(s => s.status === 'open')
      .reduce((sum, stat) => sum + parseInt(stat.count || 0), 0),
    urgent: disputeStats.filter(s => s.priority === 'high')
      .reduce((sum, stat) => sum + parseInt(stat.count || 0), 0),
    averageResolutionTime: parseFloat(disputeStats[0]?.avg_resolution_time || 0)
  };

  logger.debug('Admin dashboard stats compiled successfully');

  res.status(200).json({
    status: 'success',
    data: {
      sellers,
      products,
      revenue,
      disputes
    }
  });
});

// GET /api/v1/admin/dashboard - Get admin dashboard statistics
exports.getDashboardStats = catchAsync(async (req, res, next) => {
  const [
    sellerStats,
    productStats,
    orderStats,
    disputeStats
  ] = await Promise.all([
    // Get seller statistics
    User.findAll({
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total'],
        [Sequelize.literal(`
          SUM(CASE 
            WHEN is_active = true 
            AND role = 'seller' 
            AND last_login_at >= NOW() - INTERVAL '30 days' 
            THEN 1 
            ELSE 0 
          END)
        `), 'active'],
        [Sequelize.literal(`
          SUM(CASE 
            WHEN role = 'seller' 
            AND created_at >= NOW() - INTERVAL '30 days' 
            THEN 1 
            ELSE 0 
          END)
        `), 'new']
      ],
      where: {
        role: 'seller'
      },
      raw: true
    }),

    // Get product statistics
    Product.findAll({
      attributes: [
        [Sequelize.col('ModerationQueue.status'), 'status'],
        [Sequelize.fn('COUNT', Sequelize.col('Product.id')), 'count']
      ],
      include: [{
        model: ModerationQueue,
        attributes: [],
        where: {
          status: {
            [Op.in]: ['pending', 'approved', 'rejected']
          }
        },
        required: true
      }],
      where: {
        is_active: true,
        deletedAt: null
      },
      group: ['ModerationQueue.status'],
      raw: true
    }),

    // Get order statistics
    Order.findAll({
      attributes: [
        ['status', 'status'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'total_amount']
      ],
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      group: ['status'],
      raw: true
    }),

    // Get dispute statistics
    Dispute.findAll({
      attributes: [
        ['status', 'status'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      group: ['status'],
      raw: true
    })
  ]);

  // Format the response
  const response = {
    sellers: {
      total: sellerStats[0]?.total || 0,
      active: sellerStats[0]?.active || 0,
      new: sellerStats[0]?.new || 0
    },
    products: productStats.reduce((acc, stat) => {
      acc[stat.status] = stat.count;
      return acc;
    }, { total: productStats.reduce((sum, stat) => sum + parseInt(stat.count), 0) }),
    orders: {
      total: orderStats.reduce((sum, stat) => sum + parseInt(stat.count), 0),
      totalAmount: orderStats.reduce((sum, stat) => sum + parseFloat(stat.total_amount || 0), 0),
      byStatus: orderStats.reduce((acc, stat) => {
        acc[stat.status] = stat.count;
        return acc;
      }, {})
    },
    disputes: {
      total: disputeStats.reduce((sum, stat) => sum + parseInt(stat.count), 0),
      byStatus: disputeStats.reduce((acc, stat) => {
        acc[stat.status] = stat.count;
        return acc;
      }, {})
    }
  };

  res.status(200).json({
    status: 'success',
    data: response
  });
});

// GET /api/v1/admin/disputes - Get all open disputes
exports.getOpenDisputes = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, status } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const whereClause = {};
  if (status) {
    whereClause.status = status;
  } else {
    whereClause.status = {
      [Op.in]: ['open', 'in_progress']
    };
  }

  const { count, rows: disputes } = await Dispute.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Order,
        attributes: ['id', 'order_number', 'total_amount', 'createdAt'],
        include: [
          {
            model: User,
            as: 'customer',
            attributes: ['id', 'full_name', 'email']
          }
        ]
      },
      {
        model: User,
        as: 'seller',
        attributes: ['id', 'full_name', 'email', 'store_name']
      }
    ],
    attributes: {
      include: [
        [
          Sequelize.literal(`
            EXTRACT(EPOCH FROM (NOW() - "Dispute"."createdAt")) / 3600
          `),
          'hours_elapsed'
        ]
      ]
    },
    limit: parseInt(limit),
    offset,
    order: [['createdAt', 'DESC']],
    raw: false
  });

  // Transform the response to include formatted time elapsed
  const formattedDisputes = disputes.map(dispute => {
    const disputeObj = dispute.toJSON();
    disputeObj.timeElapsed = getTimeElapsed(dispute.createdAt);
    return disputeObj;
  });

  res.status(200).json({
    status: 'success',
    results: formattedDisputes.length,
    totalDisputes: count,
    totalPages: Math.ceil(count / parseInt(limit)),
    currentPage: parseInt(page),
    data: { disputes: formattedDisputes }
  });
});
