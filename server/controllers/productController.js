const { Product, ProductCategory, User, Review, ModerationQueue, sequelize } =
  require("../db").models;
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const { Op } = require("sequelize"); // Import Sequelize operators
const logger = require("../utils/logger");

// --- Helper Functions ---
const findProductOrThrow = async (productId, includeOptions = {}) => {
  const product = await Product.findByPk(productId, {
    include: [
      // Include associations as needed
      { model: User, as: "Seller", attributes: ["id", "full_name"] }, // Example: Include seller info
      { model: ProductCategory, as: "Category" }, // Example: Include category info
      ...(includeOptions.include || []), // Allow additional includes
    ],
    ...includeOptions, // Allow other options like 'attributes'
  });
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  return product;
};

// --- Controller Actions ---

// GET /api/v1/products - Get all products with filtering, sorting, pagination
exports.getAllProducts = catchAsync(async (req, res, next) => {
  // --- Filtering ---
  const filter = {};
  if (req.query.category) filter.category_id = req.query.category;
  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice)
      filter.price[Op.gte] = parseFloat(req.query.minPrice);
    if (req.query.maxPrice)
      filter.price[Op.lte] = parseFloat(req.query.maxPrice);
  }
  // Add search (example: search name and description)
  if (req.query.search) {
    filter[Op.or] = [
      { name: { [Op.iLike]: `%${req.query.search}%` } }, // Case-insensitive search
      { description: { [Op.iLike]: `%${req.query.search}%` } },
    ];
  }
  // TODO: Filter only approved products for regular users
  // filter.status = 'approved'; // Assuming a status field after moderation integration

  // --- Sorting ---
  let order = [["createdAt", "DESC"]]; // Default sort
  if (req.query.sort) {
    const [field, direction = "ASC"] = req.query.sort.split(":");
    const allowedSortFields = ["name", "price", "createdAt", "rating"]; // Define allowed fields
    if (allowedSortFields.includes(field)) {
      // Handle sorting by rating (needs aggregation or a dedicated rating field)
      // if (field === 'rating') { /* Add logic for sorting by rating */ } else {
      order = [[field, direction.toUpperCase()]];
      // }
    }
  }

  // --- Pagination ---
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10; // Default limit 10
  const offset = (page - 1) * limit;

  // --- Fetch Products ---
  const { count, rows: products } = await Product.findAndCountAll({
    where: filter,
    include: [
      { model: ProductCategory, as: "Category", attributes: ["id", "name"] },
      { model: User, as: "Seller", attributes: ["id", "full_name"] }, // Avoid sending sensitive seller info
      // Optional: Include average rating if calculated
    ],
    order,
    limit,
    offset,
    distinct: true, // Important for count when using includes
  });

  // --- Send Response ---
  res.status(200).json({
    status: "success",
    results: products.length,
    totalProducts: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    data: {
      products,
    },
  });
});

// GET /api/v1/products/:id - Get a single product by ID
exports.getProductById = catchAsync(async (req, res, next) => {
  const productId = req.params.id;
  const product = await findProductOrThrow(productId, {
    include: [
      // Include more details for single product view
      { model: User, as: "Seller", attributes: ["id", "full_name"] },
      { model: ProductCategory, as: "Category" },
      {
        model: Review,
        as: "Reviews",
        include: [{ model: User, as: "User", attributes: ["id", "full_name"] }],
      }, // Include reviews and reviewer names
      // { model: ProductImage, as: 'Images' } // Include images if model exists
    ],
  });

  // TODO: Check if product is approved if user is not seller/admin

  res.status(200).json({
    status: "success",
    data: {
      product,
    },
  });
});

// POST /api/v1/products - Create a new product (Seller only)
exports.createProduct = catchAsync(async (req, res, next) => {
  const {
    name,
    description,
    price,
    stock_quantity,
    category_id,
    preview_image_url,
  } = req.body;
  const seller_id = req.user.id; // Get seller ID from authenticated user

  // Check if category exists
  const category = await ProductCategory.findByPk(category_id);
  if (!category) {
    return next(new AppError("Category not found", 404));
  }

  // Create the product
  const newProduct = await Product.create({
    name,
    description,
    price,
    stock_quantity,
    category_id,
    seller_id,
    preview_image_url, // Optional
    // TODO: Set initial status (e.g., 'pending_moderation') if moderation is implemented
  });

  // TODO: If moderation queue is used, create an entry in ModerationQueue
  // await ModerationQueue.create({ product_id: newProduct.id, status: 'pending' });
  logger.info(
    `Product created by Seller ${seller_id}: ID ${newProduct.id}, Name: ${name}`
  );

  res.status(201).json({
    // 201 Created
    status: "success",
    data: {
      product: newProduct,
    },
  });
});

// PATCH /api/v1/products/:id - Update a product (Seller only)
exports.updateProduct = catchAsync(async (req, res, next) => {
  const productId = req.params.id;
  const seller_id = req.user.id;

  // Find the product and ensure the logged-in user is the seller
  const product = await findProductOrThrow(productId);

  if (product.seller_id !== seller_id) {
    return next(
      new AppError("You do not have permission to update this product", 403)
    ); // Forbidden
  }

  // Fields allowed to be updated by the seller
  const allowedUpdates = [
    "name",
    "description",
    "price",
    "stock_quantity",
    "category_id",
    "preview_image_url",
  ];
  const updates = {};
  Object.keys(req.body).forEach((key) => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  // Special check if category is being updated
  if (updates.category_id) {
    const category = await ProductCategory.findByPk(updates.category_id);
    if (!category) {
      return next(new AppError("Category not found", 404));
    }
  }

  // Perform the update
  const [updateCount] = await Product.update(updates, {
    where: { id: productId, seller_id: seller_id }, // Double check seller ownership
    returning: false, // Don't need the updated rows back directly
  });

  if (updateCount === 0) {
    // This shouldn't happen if findProductOrThrow worked, but good safety check
    return next(
      new AppError("Product not found or you do not have permission", 404)
    );
  }

  // Fetch the updated product to return it
  const updatedProduct = await findProductOrThrow(productId);
  logger.info(`Product updated by Seller ${seller_id}: ID ${productId}`);

  // TODO: If product details change significantly, maybe trigger re-moderation?
  // await ModerationQueue.upsert({ product_id: productId, status: 'pending' });

  res.status(200).json({
    status: "success",
    data: {
      product: updatedProduct,
    },
  });
});

// DELETE /api/v1/products/:id - Delete a product (Seller or Admin)
exports.deleteProduct = catchAsync(async (req, res, next) => {
  const productId = req.params.id;
  const user = req.user;

  const product = await findProductOrThrow(productId);

  // Check permissions: Only the seller or an admin can delete
  if (user.role !== "admin" && product.seller_id !== user.id) {
    return next(
      new AppError("You do not have permission to delete this product", 403)
    ); // Forbidden
  }

  // Optional: Check if product is part of any active orders before deleting? (Business rule)
  // const activeOrderItems = await OrderItem.count({ where: { product_id: productId, /* add order status filter */ } });
  // if (activeOrderItems > 0) {
  //     return next(new AppError('Cannot delete product involved in active orders. Consider disabling instead.', 409)); // Conflict
  // }

  // Perform the deletion
  const deleteCount = await Product.destroy({
    where: { id: productId },
  });

  if (deleteCount === 0) {
    // Should not happen if findProductOrThrow worked
    return next(new AppError("Product not found", 404));
  }

  logger.info(
    `Product deleted by User ${user.id} (Role: ${user.role}): ID ${productId}`
  );

  // TODO: Also delete related items like ProductImages, Reviews? Or handle via CASCADE constraints in DB.
  // TODO: Remove from moderation queue if pending.

  res.status(204).json({
    // 204 No Content
    status: "success",
    data: null,
  });
});

// --- Review Related Actions (Nested under products) ---

// GET /api/v1/products/:productId/reviews
exports.getProductReviews = catchAsync(async (req, res, next) => {
  const productId = req.params.productId;
  await findProductOrThrow(productId); // Ensure product exists

  const reviews = await Review.findAll({
    where: { product_id: productId },
    include: [
      { model: User, as: "User", attributes: ["id", "full_name"] },
      // Optional: Include vote counts if implemented
    ],
    order: [["createdAt", "DESC"]],
  });

  res.status(200).json({
    status: "success",
    results: reviews.length,
    data: { reviews },
  });
});

// POST /api/v1/products/:productId/reviews
exports.createProductReview = catchAsync(async (req, res, next) => {
  const productId = req.params.productId;
  const userId = req.user.id;
  const { rating, review_text } = req.body;

  // 1. Check if product exists
  await findProductOrThrow(productId);

  // 2. Business Rule: Check if user has purchased this product (optional but common)
  // const hasPurchased = await Order.count({
  //    where: { customer_id: userId },
  //    include: [{
  //        model: OrderItem,
  //        as: 'orderItems',
  //        where: { product_id: productId },
  //        required: true
  //    }]
  // });
  // if (hasPurchased === 0) {
  //    return next(new AppError('You can only review products you have purchased.', 403));
  // }

  // 3. Business Rule: Check if user has already reviewed this product
  const existingReview = await Review.findOne({
    where: { product_id: productId, user_id: userId },
  });
  if (existingReview) {
    return next(new AppError("You have already reviewed this product.", 409)); // Conflict
  }

  // 4. Create the review
  const newReview = await Review.create({
    product_id: productId,
    user_id: userId,
    rating,
    review_text,
  });

  // TODO: Update product's average rating (could be done via DB trigger or here)

  logger.info(`Review created by User ${userId} for Product ${productId}`);

  res.status(201).json({
    status: "success",
    data: { review: newReview },
  });
});
