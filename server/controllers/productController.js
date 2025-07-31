const {
  Product,
  ProductCategory,
  User,
  Review,
  ModerationQueue,
  ProductImage,
  Order,
  OrderItem,
  sequelize,
} = require("../db");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const { Op } = require("sequelize"); // Import Sequelize operators
const logger = require("../utils/logger");
const { paginateResults } = require("../middleware/paginationMiddleware");

// --- Helper Functions ---
const findProductOrThrow = async (productId, includeOptions = {}) => {
  // First query: Get product details without reviews
  const product = await Product.findByPk(productId, {
    include: [
      { model: User, as: "Seller", attributes: ["id", "full_name"] },
      { model: ProductCategory, as: "Category" },
      { model: ProductImage, as: "Images" },
      { model: ModerationQueue, as: "moderationStatus" },
      ...(includeOptions.include || []),
    ],
    ...includeOptions,
  });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // Second query: Get review stats separately
  const reviewStats = await Review.findOne({
    where: { product_id: productId },
    attributes: [
      [sequelize.fn("COUNT", sequelize.col("id")), "reviewCount"],
      [sequelize.fn("AVG", sequelize.col("rating")), "averageRating"],
    ],
    raw: true,
  });

  const plainProduct = product.toJSON();
  return {
    ...plainProduct,
    reviewCount: parseInt(reviewStats?.reviewCount || 0, 10),
    averageRating: parseFloat(reviewStats?.averageRating || 0),
  };
};

const getRoleBasedProductFilter = (user) => {
  // Default filter for guests - only approved products with approved sellers
  let filter = {
    '$moderationStatus.status$': 'approved',
    '$Seller.status$': 'active'
  };

  if (user) {
    if (user.role === 'admin') {
      // Admin can see all products, no default filter
      filter = {};
    } else if (user.role === 'seller') {
      // Seller can see:
      // 1. All their own products (any status)
      // 2. Other sellers' approved products
      filter = {
        [Op.or]: [
          { seller_id: user.id },
          {
            [Op.and]: [
              { seller_id: { [Op.ne]: user.id } },
              { '$moderationStatus.status$': 'approved' },
              { '$Seller.status$': 'active' }
            ]
          }
        ]
      };
    }
  }

  return filter;
};

const getProductListFilters = (query, user) => {
  const roleBasedFilter = getRoleBasedProductFilter(user);
  const filters = { ...roleBasedFilter };

  // Handle status filtering based on user role
  if (query.status && user) {
    if (user.role === 'admin') {
      if (query.status === 'all') {
        // Remove status filter for admin viewing all
        delete filters['$moderationStatus.status$'];
      } else {
        // Admin filtering by specific status
        filters['$moderationStatus.status$'] = query.status;
      }
    } else if (user.role === 'seller') {
      if (query.status === 'mine') {
        // Show all own products
        filters = { seller_id: user.id };
      } else if (query.status === 'approved') {
        // Show only other sellers' approved products
        filters = {
          [Op.and]: [
            { seller_id: { [Op.ne]: user.id } },
            { '$moderationStatus.status$': 'approved' },
            { '$Seller.status$': 'active' }
          ]
        };
      } else if (['pending', 'rejected'].includes(query.status)) {
        // Show only own pending/rejected products
        filters = {
          [Op.and]: [
            { seller_id: user.id },
            { '$moderationStatus.status$': query.status }
          ]
        };
      }
      // 'all' shows default role-based filter (own + others' approved)
    }
  }

  // Apply category filter
  if (query.category) {
    filters.category_id = query.category;
  }

  // Apply price range filter
  if (query.minPrice || query.maxPrice) {
    filters.price = {};
    if (query.minPrice) filters.price[Op.gte] = parseFloat(query.minPrice);
    if (query.maxPrice) filters.price[Op.lte] = parseFloat(query.maxPrice);
  }

  // Apply search filter
  if (query.search) {
    const searchCondition = { [Op.iLike]: `%${query.search}%` };
    if (filters[Op.and]) {
      filters[Op.and].push({
        [Op.or]: [
          { name: searchCondition },
          { description: searchCondition }
        ]
      });
    } else if (filters[Op.or]) {
      // Add search conditions to each branch of OR
      filters[Op.or] = filters[Op.or].map(branch => ({
        ...branch,
        [Op.and]: [
          ...(branch[Op.and] || []),
          {
            [Op.or]: [
              { name: searchCondition },
              { description: searchCondition }
            ]
          }
        ]
      }));
    } else {
      filters[Op.and] = [{
        [Op.or]: [
          { name: searchCondition },
          { description: searchCondition }
        ]
      }];
    }
  }

  return filters;
};

// --- Controller Actions ---

// GET /api/v1/products - Get all products with filtering, sorting, pagination
exports.getAllProducts = catchAsync(async (req, res, next) => {
  try {
    const filter = {};
    const order = [['createdAt', 'DESC']];

    // Get user context and query parameters
    const userRole = req.user?.role;
    const userId = req.user?.id;
    const statusFilter = req.query.status;
    const excludeSeller = req.query.exclude_seller;
    const requestedSellerId = req.query.seller_id;

    // Setup base includes
    const moderationInclude = {
      model: ModerationQueue,
      as: "moderationStatus",
      attributes: ["status", "feedback"],
      required: false,
    };

    const include = [
      {
        model: ProductCategory,
        as: "Category",
        attributes: ["id", "name"],
      },
      {
        model: User,
        as: "Seller",
        attributes: ["id", "full_name", "email"],
      },
      moderationInclude,
      {
        model: Review,
        as: 'Reviews',
        attributes: ['rating'],
        required: false
      }
    ];

    // Apply visibility logic based on user role
    if (userRole === 'admin') {
      if (statusFilter && ['pending', 'approved', 'rejected'].includes(statusFilter)) {
        filter['$moderationStatus.status$'] = statusFilter;
        moderationInclude.required = true;
      }
    } else if (userRole === 'seller') {
      if (requestedSellerId) {
        // Show only their own products (any status)
        filter.seller_id = userId;
      } else if (excludeSeller) {
        // Show only other sellers' approved products
        filter[Op.and] = [
          { seller_id: { [Op.ne]: excludeSeller } },
          { '$moderationStatus.status$': 'approved' }
        ];
        moderationInclude.required = true;
      } else if (statusFilter === 'pending' || statusFilter === 'rejected') {
        // Show only their own pending/rejected products
        filter[Op.and] = [
          { seller_id: userId },
          { '$moderationStatus.status$': statusFilter }
        ];
        moderationInclude.required = true;
      } else {
        // Default: show all own products + other sellers' approved products
        filter[Op.or] = [
          { seller_id: userId },
          {
            [Op.and]: [
              { seller_id: { [Op.ne]: userId } },
              { '$moderationStatus.status$': 'approved' }
            ]
          }
        ];
      }
    } else {
      // Regular users and guests - only see approved products
      filter['$moderationStatus.status$'] = 'approved';
      moderationInclude.required = true;
    }

    // Apply category filter
    if (req.query.category) {
      const categoryId = parseInt(req.query.category, 10);
      if (!isNaN(categoryId)) {
        filter.category_id = categoryId;
      }
    }

    // Apply search filter
    if (req.query.search) {
      const searchQuery = req.query.search.trim();
      if (searchQuery.length >= 2) {
        const searchCondition = { [Op.iLike]: `%${searchQuery}%` };
        filter[Op.and] = filter[Op.and] || [];
        filter[Op.and].push({
          [Op.or]: [
            { name: searchCondition },
            { description: searchCondition }
          ]
        });
      }
    }

    // Handle pagination
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const offset = (page - 1) * limit;

    // Execute query
    const { rows: products, count } = await Product.findAndCountAll({
      where: filter,
      attributes: {
        include: [
          [sequelize.fn('COUNT', sequelize.col('Reviews.id')), 'reviewCount'],
          [sequelize.fn('COALESCE', sequelize.fn('AVG', sequelize.col('Reviews.rating')), 0), 'averageRating']
        ]
      },
      include,
      order,
      limit,
      offset,
      distinct: true,
      group: ['Product.id', 'Category.id', 'Seller.id', 'moderationStatus.id'],
      subQuery: false
    });

    // Calculate total items and pages
    const totalProducts = Array.isArray(count) ? count.length : count;
    const totalPages = Math.ceil(totalProducts / limit);

    // Transform and return response
    res.status(200).json({
      status: 'success',
      currentPage: page,
      totalPages,
      totalProducts,
      data: {
        products: products.map(product => {
          const plainProduct = product.get({ plain: true });
          return {
            ...plainProduct,
            reviewCount: parseInt(plainProduct.reviewCount || 0, 10),
            averageRating: parseFloat(plainProduct.averageRating || 0).toFixed(1)
          };
        })
      }
    });
  } catch (error) {
    logger.error('Error in getAllProducts:', error);
    next(new AppError(error.message || 'Error fetching products', 500));
  }
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
      { model: ProductImage, as: "Images" }, // Include images for gallery
    ],
  });

  // ...existing code...

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
    preview_image_url, // Not used if images uploaded
  } = req.body;
  const seller_id = req.user.id;

  // Check if category exists
  const category = await ProductCategory.findByPk(category_id);
  if (!category) {
    return next(new AppError("Category not found", 404));
  }

  // Create the product (no preview_image_url yet)
  const newProduct = await Product.create({
    name,
    description,
    price,
    stock_quantity,
    category_id,
    seller_id,
  });

  // Handle uploaded images
  let previewUrl = null;
  if (req.files && req.files.length > 0) {
    // Save images as ProductImage records
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const url = `/uploads/products/${file.filename}`;
      const image_type = i === 0 ? "preview" : "gallery";
      await ProductImage.create({
        product_id: newProduct.id,
        url,
        image_type,
        display_order: i,
      });
      if (i === 0) previewUrl = url;
    }
    // Set preview_image_url to first image
    await newProduct.update({ preview_image_url: previewUrl });
  } else if (preview_image_url) {
    // If no files, but preview_image_url provided (legacy)
    await ProductImage.create({
      product_id: newProduct.id,
      url: preview_image_url,
      image_type: "preview",
      display_order: 0,
    });
    await newProduct.update({ preview_image_url });
  }

  // Always add to moderation queue as pending
  await ModerationQueue.create({
    product_id: newProduct.id,
    status: "pending",
  });
  logger.info(
    `Product created by Seller ${seller_id}: ID ${newProduct.id}, Name: ${name} (pending moderation)`
  );
  res.status(201).json({
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

  // If any key fields changed, re-queue for moderation as pending
  const moderationFields = [
    "name",
    "description",
    "price",
    "stock_quantity",
    "category_id",
    "preview_image_url",
  ];
  const changed = Object.keys(updates).some((key) =>
    moderationFields.includes(key)
  );
  if (changed) {
    await ModerationQueue.upsert({ product_id: productId, status: "pending" });
    logger.info(
      `Product ${productId} re-queued for moderation after seller update.`
    );
  }

  // Fetch the updated product to return it
  const updatedProduct = await findProductOrThrow(productId);
  logger.info(`Product updated by Seller ${seller_id}: ID ${productId}`);

  // ...existing code...
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

  // ...existing code...
  // ...existing code...

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

  // If user is authenticated, get their ID (optional)
  const userId = req.user ? req.user.id : null;

  // Fetch reviews with votes
  const reviews = await Review.findAll({
    where: { product_id: productId },
    include: [
      { model: User, as: "User", attributes: ["id", "full_name"] },
      {
        model: sequelize.models.ReviewVote,
        as: "votes",
        attributes: ["user_id", "vote_type"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  // Map reviews to include vote counts and user's vote
  const reviewsWithVotes = reviews.map((review) => {
    const votes = review.votes || [];
    const helpful = votes.filter((v) => v.vote_type === "helpful").length;
    const notHelpful = votes.filter(
      (v) => v.vote_type === "not_helpful"
    ).length;
    let userVote = null;
    if (userId) {
      const found = votes.find((v) => v.user_id === userId);
      userVote = found ? found.vote_type : null;
    }
    return {
      ...review.toJSON(),
      voteCounts: { helpful, notHelpful },
      userVote,
    };
  });

  res.status(200).json({
    status: "success",
    results: reviewsWithVotes.length,
    data: { reviews: reviewsWithVotes },
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

  // ...existing code...

  logger.info(`Review created by User ${userId} for Product ${productId}`);

  res.status(201).json({
    status: "success",
    data: { review: newReview },
  });
});

// Search functionality
exports.searchProducts = catchAsync(async (req, res, next) => {
  const { query } = req.query;

  if (!query || query.trim().length < 2) {
    return next(
      new AppError("Search query must be at least 2 characters long", 400)
    );
  }

  const products = await Product.findAndCountAll({
    where: {
      [Op.or]: [
        { name: { [Op.iLike]: `%${query}%` } },
        { description: { [Op.iLike]: `%${query}%` } },
      ],
      // Only return approved products for public search
      moderationStatus: { status: "approved" },
    },
    include: [
      {
        model: ProductCategory,
        as: "Category",
        attributes: ["id", "name"],
      },
      {
        model: ProductImage,
        as: "Images",
        attributes: ["id", "url", "isPrimary"],
        limit: 1,
        where: { isPrimary: true },
        required: false,
      },
    ],
    distinct: true,
    ...paginateResults(req.query),
  });

  logger.info(`Search query "${query}" returned ${products.count} results`);

  res.status(200).json({
    status: "success",
    data: {
      products: products.rows,
      total: products.count,
    },
  });
});

// GET /api/v1/products - Get all products with filtering, sorting, pagination
exports.getProducts = catchAsync(async (req, res, next) => {
  const filters = getProductListFilters(req.query, req.user);
  const sortOptions = {};

  // Handle sorting
  if (req.query.sortBy) {
    const order = req.query.order === 'desc' ? 'DESC' : 'ASC';
    sortOptions.order = [[req.query.sortBy, order]];
  } else {
    sortOptions.order = [['created_at', 'DESC']];
  }

  const { limit, offset } = req.pagination;

  const products = await Product.findAndCountAll({
    where: filters,
    include: [
      { 
        model: User,
        as: 'Seller',
        attributes: ['id', 'full_name']
      },
      {
        model: ProductCategory,
        as: 'Category',
        attributes: ['id', 'name']
      },
      {
        model: ProductImage,
        as: 'Images',
        attributes: ['id', 'url']
      }
    ],
    ...sortOptions,
    limit,
    offset,
    distinct: true
  });

  // Get review stats for each product
  const productsWithStats = await Promise.all(
    products.rows.map(async (product) => {
      const reviewStats = await Review.findOne({
        where: { product_id: product.id },
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'reviewCount'],
          [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating']
        ],
        raw: true
      });

      const plainProduct = product.toJSON();
      return {
        ...plainProduct,
        reviewCount: parseInt(reviewStats?.reviewCount || 0, 10),
        averageRating: parseFloat(reviewStats?.averageRating || 0)
      };
    })
  );

  const response = paginateResults(
    productsWithStats,
    products.count,
    req.pagination
  );

  res.status(200).json({
    status: 'success',
    data: response
  });
});

// Get product statistics for a seller
exports.getProductStats = catchAsync(async (req, res, next) => {
  const sellerId = parseInt(req.params.sellerId || req.user.id);

  if (!sellerId) {
    return next(new AppError('Seller ID is required', 400));
  }

  try {
    // Get all status counts in one query for efficiency
    const statusCounts = await Product.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('Product.id')), 'total'],
        [sequelize.literal(`
          SUM(CASE 
            WHEN ModerationQueue.status = 'pending' THEN 1 
            ELSE 0 
          END)`), 'pendingCount'],
        [sequelize.literal(`
          SUM(CASE 
            WHEN ModerationQueue.status = 'rejected' THEN 1 
            ELSE 0 
          END)`), 'rejectedCount'],
        [sequelize.literal(`
          SUM(CASE 
            WHEN ModerationQueue.status = 'approved' THEN 1 
            ELSE 0 
          END)`), 'approvedCount'],
        [sequelize.literal(`
          SUM(CASE 
            WHEN Product.stock_quantity < Product.low_stock_threshold THEN 1 
            ELSE 0 
          END)`), 'lowStockCount']
      ],
      include: [{
        model: ModerationQueue,
        as: 'moderationStatus',
        attributes: [],
        required: false
      }],
      where: { seller_id: sellerId },
      raw: true
    });

    // Get counts for specific date ranges
    const lastWeekStats = await Product.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('Product.id')), 'newProducts'],
        [sequelize.literal(`
          SUM(CASE 
            WHEN Product.stock_quantity < Product.low_stock_threshold THEN 1 
            ELSE 0 
          END)`), 'newLowStock']
      ],
      where: {
        seller_id: sellerId,
        createdAt: {
          [Op.gte]: new Date(new Date() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      raw: true
    });

    // Get order-related stats
    const orderStats = await OrderItem.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('OrderItem.id')), 'totalOrders'],
        [sequelize.fn('SUM', sequelize.col('OrderItem.quantity')), 'totalUnitsSold']
      ],
      include: [{
        model: Product,
        as: 'Product',
        attributes: [],
        where: { seller_id: sellerId }
      }],
      raw: true
    });

    const stats = {
      ...statusCounts[0],
      ...lastWeekStats[0],
      ...orderStats[0],
      // Ensure all values are numbers, not strings
      total: parseInt(statusCounts[0].total || 0),
      pendingCount: parseInt(statusCounts[0].pendingCount || 0),
      rejectedCount: parseInt(statusCounts[0].rejectedCount || 0),
      approvedCount: parseInt(statusCounts[0].approvedCount || 0),
      lowStockCount: parseInt(statusCounts[0].lowStockCount || 0),
      newProducts: parseInt(lastWeekStats[0]?.newProducts || 0),
      newLowStock: parseInt(lastWeekStats[0]?.newLowStock || 0),
      totalOrders: parseInt(orderStats[0]?.totalOrders || 0),
      totalUnitsSold: parseInt(orderStats[0]?.totalUnitsSold || 0)
    };

    logger.info(`Product stats retrieved for seller ${sellerId}`);

    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    logger.error('Error getting product stats:', error);
    return next(new AppError('Error getting product statistics', 500));
  }
});

// Update product status (Admin only)
exports.updateProductStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status, feedback } = req.body;

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return next(new AppError('Invalid status value', 400));
  }

  const product = await Product.findByPk(id, {
    include: [
      { model: ModerationQueue, as: 'moderationStatus' },
      { model: User, as: 'Seller', attributes: ['id', 'email'] }
    ]
  });

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  const transaction = await sequelize.transaction();

  try {
    // Create new moderation queue entry
    await ModerationQueue.create({
      product_id: id,
      admin_id: req.user.id,
      status,
      feedback: feedback || null,
      reviewed_at: new Date()
    }, { transaction });

    // If status is approved, update the product's active status
    if (status === 'approved') {
      await product.update({ is_active: true }, { transaction });
    } else {
      await product.update({ is_active: false }, { transaction });
    }

    await transaction.commit();

    // Send notification to seller (you would implement this)
    // await notifyUser(product.Seller.email, {
    //   type: 'PRODUCT_STATUS_UPDATE',
    //   status,
    //   productId: id,
    //   feedback
    // });

    logger.info(`Product ${id} status updated to ${status} by admin ${req.user.id}`);

    res.status(200).json({
      status: 'success',
      data: {
        id: product.id,
        status,
        feedback,
        updated_at: new Date()
      }
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Error updating product status:', error);
    return next(new AppError('Failed to update product status', 500));
  }
});
