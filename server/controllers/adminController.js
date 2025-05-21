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
} = require("../db").models;
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");
const { Op } = require("sequelize");

// --- User Management ---

// GET /api/v1/admin/users - List all users with pagination and filtering
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, role, search } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const whereClause = {};
  if (role) whereClause.role = role;
  if (search) {
    whereClause[Op.or] = [
      { full_name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
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
  const { page = 1, limit = 10, status = "pending" } = req.query; // Default to pending
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const whereClause = {};
  if (status && ["pending", "approved", "rejected"].includes(status)) {
    whereClause.status = status;
  }

  const { count, rows: moderationItems } =
    await ModerationQueue.findAndCountAll({
      where: whereClause,
      include: [
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
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit, 10),
      offset,
    });

  logger.debug(
    `Admin retrieved ${moderationItems.length} moderation items. Status: ${status}`
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

  // TODO: If product model has a status, update it as well.
  // For now, we assume the ModerationQueue table is the source of truth for moderated status.
  // Example if Product model has a 'moderation_status' field:
  // await Product.update({ moderation_status: status }, { where: { id: moderationEntry.product_id } });

  logger.info(
    `Admin ${adminId} moderated Product ID ${moderationEntry.product_id} (Queue ID: ${moderationId}) to status: ${status}.`
  );

  // TODO: Send notification to seller about product approval/rejection
  // (e.g., using an email service or internal notification system)

  res.status(200).json({
    status: "success",
    message: `Product moderation status updated to ${status}.`,
    data: { moderationEntry },
  });
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
    // TODO: Send notification to customer about order status update
  } else {
    logger.info(`Admin ${adminId}: No changes applied to Order ID ${orderId}.`);
    return res
      .status(200)
      .json({
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
exports.getAllDisputes = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, status, orderId, userId } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const whereClause = {};
  if (status) whereClause.status = status;
  if (orderId) whereClause.order_id = orderId;
  if (userId) whereClause.raised_by_user_id = userId;

  const { count, rows: disputes } = await Dispute.findAndCountAll({
    where: whereClause,
    include: [
      { model: Order, as: "order", attributes: ["id", "order_date"] },
      { model: User, as: "raisedBy", attributes: ["id", "full_name", "email"] },
      { model: User, as: "resolver", attributes: ["id", "full_name"] },
    ],
    order: [["createdAt", "DESC"]],
    limit: parseInt(limit, 10),
    offset,
  });
  res
    .status(200)
    .json({
      status: "success",
      results: disputes.length,
      totalItems: count,
      data: { disputes },
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
