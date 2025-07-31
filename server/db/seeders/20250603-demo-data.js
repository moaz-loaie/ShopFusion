// Demo data seeder for ShopFusion
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Truncate tables to reset auto-increment and avoid FK errors
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await queryInterface.bulkDelete('ProductImages', null, {
      truncate: true,
      restartIdentity: true,
    });
    await queryInterface.bulkDelete('Products', null, {
      truncate: true,
      restartIdentity: true,
    });
    await queryInterface.bulkDelete('Users', null, {
      truncate: true,
      restartIdentity: true,
    });
    await queryInterface.bulkDelete('ProductCategories', null, {
      truncate: true,
      restartIdentity: true,
    });
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    // Insert categories
    await queryInterface.bulkInsert('ProductCategories', [
      {
        name: 'Electronics',
        description: 'Phones, laptops, gadgets, and more.',
        thumbnail_url:
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Fashion',
        description: 'Clothing, shoes, and accessories.',
        thumbnail_url:
          'https://images.unsplash.com/photo-1512436991641-6745cdb1723f',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Home & Kitchen',
        description: 'Furniture, appliances, and decor.',
        thumbnail_url:
          'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Books',
        description: 'Fiction, non-fiction, and educational books.',
        thumbnail_url:
          'https://images.unsplash.com/photo-1512820790803-83ca734da794',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Toys',
        description: 'Toys and games for all ages.',
        thumbnail_url:
          'https://images.unsplash.com/photo-1519125323398-675f0ddb6308',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // --- Bulk Users Generation ---
    const userCount = 130;
    const sellerCount = 25;
    const customerCount = userCount - sellerCount - 1; // 1 admin
    const users = [
      {
        email: 'admin@shopfusion.com',
        full_name: 'Admin User',
        password_hash:
          '$2b$12$Z7KDE/8ouW1JWG5aClE/te.P9l4zvLQeHtDXmjEbYcPtr8xvybPNS', // password123
        role: 'admin',
        is_active: true, // Admin is always active
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    // Add 25 sellers
    for (let i = 1; i <= sellerCount; i++) {
      users.push({
        email: `seller${i}@shopfusion.com`,
        full_name: `Seller ${i}`,
        password_hash:
          '$2b$12$Z7KDE/8ouW1JWG5aClE/te.P9l4zvLQeHtDXmjEbYcPtr8xvybPNS',
        role: 'seller',
        is_active: Math.random() > 0.1, // 10% chance of being inactive
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    // Add 104 customers
    for (let i = 1; i <= customerCount; i++) {
      users.push({
        email: `customer${i}@shopfusion.com`,
        full_name: `Customer ${i}`,
        password_hash:
          '$2b$12$Z7KDE/8ouW1JWG5aClE/te.P9l4zvLQeHtDXmjEbYcPtr8xvybPNS',
        role: 'customer',
        is_active: Math.random() > 0.05, // 5% chance of being inactive
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await queryInterface.bulkInsert('Users', users);

    // --- Bulk Products Generation ---
    const productCount = 1000;
    const categories = [1, 2, 3, 4, 5];
    const products = [];
    for (let i = 1; i <= productCount; i++) {
      const seller_id = 2 + ((i - 1) % sellerCount); // sellers 2-26
      const category_id = categories[(i - 1) % categories.length];
      products.push({
        seller_id,
        category_id,
        name: `Product ${i}`,
        description: `Description for Product ${i}.`,
        price: (Math.random() * 500 + 10).toFixed(2),
        stock_quantity: Math.floor(Math.random() * 100) + 1,
        preview_image_url: `https://picsum.photos/seed/prod${i}/400/400`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await queryInterface.bulkInsert('Products', products);

    // --- ModerationQueue: Approve all products ---
    const now = new Date();
    const moderationQueue = [];
    for (let i = 1; i <= productCount; i++) {
      moderationQueue.push({
        product_id: i,
        status: 'approved',
        createdAt: now,
        updatedAt: now,
      });
    }
    await queryInterface.bulkInsert('ModerationQueue', moderationQueue);

    // --- ProductImages: Add preview, thumbnail, and 2 gallery images per product ---
    const productImages = [];
    for (let i = 1; i <= productCount; i++) {
      productImages.push(
        {
          product_id: i,
          url: `https://picsum.photos/seed/prod${i}-main/600/600`,
          image_type: 'preview',
          display_order: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          product_id: i,
          url: `https://picsum.photos/seed/prod${i}-thumb/200/200`,
          image_type: 'thumbnail',
          display_order: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          product_id: i,
          url: `https://picsum.photos/seed/prod${i}-g1/400/400`,
          image_type: 'gallery',
          display_order: 2,
          createdAt: now,
          updatedAt: now,
        },
        {
          product_id: i,
          url: `https://picsum.photos/seed/prod${i}-g2/400/400`,
          image_type: 'gallery',
          display_order: 3,
          createdAt: now,
          updatedAt: now,
        }
      );
    }
    await queryInterface.bulkInsert('ProductImages', productImages);

    // --- Orders: 220 orders, each with 1-5 items ---
    const orderCount = 220;
    const orders = [];
    for (let i = 1; i <= orderCount; i++) {
      const customer_id = 1 + sellerCount + ((i - 1) % customerCount); // customers after sellers
      orders.push({
        customer_id,
        order_date: now,
        order_status: 'delivered',
        total_amount: (Math.random() * 1000 + 50).toFixed(2),
        createdAt: now,
        updatedAt: now,
      });
    }
    await queryInterface.bulkInsert('Orders', orders);
    // Fetch real order IDs from DB for valid order items
    const [orderRows] = await queryInterface.sequelize.query(
      'SELECT id FROM Orders'
    );
    const realOrderIds = orderRows.map((r) => r.id);
    // --- OrderItems: 1-5 per order, valid order IDs ---
    const orderItems = [];
    for (let i = 0; i < realOrderIds.length; i++) {
      const order_id = realOrderIds[i];
      const itemsInOrder = Math.floor(Math.random() * 5) + 1;
      for (let j = 0; j < itemsInOrder; j++) {
        const product_id = Math.floor(Math.random() * productCount) + 1;
        orderItems.push({
          order_id,
          product_id,
          quantity: Math.floor(Math.random() * 3) + 1,
          unit_price: (Math.random() * 500 + 10).toFixed(2),
          createdAt: now,
          updatedAt: now,
        });
      }
    }
    await queryInterface.bulkInsert('OrderItems', orderItems);

    // --- Disputes: Create disputes for orders ---
    const disputes = [];
    const disputeCount = 130; // Create 130 disputes
    const priorities = ['low', 'medium', 'high'];
    const statuses = ['open', 'resolved', 'rejected', 'under_review'];
    const adminId = 1; // First user is admin

    for (let i = 0; i < disputeCount; i++) {
      const order_id = realOrderIds[i % realOrderIds.length];
      const priority =
        priorities[Math.floor(Math.random() * priorities.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const isResolved = status === 'resolved';

      disputes.push({
        order_id,
        raised_by_user_id: 1 + sellerCount + (i % customerCount),
        dispute_reason: `Issue with order #${order_id}: ${
          [
            'Wrong item received',
            'Item damaged',
            'Item not received',
            'Item different from description',
          ][Math.floor(Math.random() * 4)]
        }`,
        status,
        resolution_details: isResolved
          ? `Issue resolved: ${
              ['Refund issued', 'Replacement sent', 'Return processed'][
                Math.floor(Math.random() * 3)
              ]
            }`
          : null,
        resolved_by_user_id: isResolved ? adminId : null,
        resolved_at: isResolved ? now : null,
        priority,
        createdAt: now,
        updatedAt: now,
      });
    }
    await queryInterface.bulkInsert('Disputes', disputes);

    // --- Reviews: 2000 reviews (unique per product/user) ---
    const reviews = [];
    const usedReviewPairs = new Set();
    let reviewId = 1;
    for (let i = 0; i < 2000; i++) {
      let product_id, user_id, pairKey;
      do {
        product_id = Math.floor(Math.random() * productCount) + 1;
        user_id = 1 + sellerCount + Math.floor(Math.random() * customerCount);
        pairKey = `${product_id}_${user_id}`;
      } while (usedReviewPairs.has(pairKey));
      usedReviewPairs.add(pairKey);
      reviews.push({
        product_id,
        user_id,
        rating: Math.floor(Math.random() * 5) + 1,
        review_text: `Review for product ${product_id} by user ${user_id}`,
        createdAt: now,
        updatedAt: now,
      });
      reviewId++;
    }
    await queryInterface.bulkInsert('Reviews', reviews);

    // --- Fetch real review IDs from DB for valid review votes ---
    const [reviewRows] = await queryInterface.sequelize.query(
      'SELECT id FROM Reviews'
    );
    const realReviewIds = reviewRows.map((r) => r.id);

    // --- ReviewVotes: 20000 votes (unique per review/user, valid review IDs) ---
    const reviewVotes = [];
    const usedVotePairs = new Set();
    for (let i = 0; i < 20000; i++) {
      let review_id, user_id, pairKey;
      do {
        review_id =
          realReviewIds[Math.floor(Math.random() * realReviewIds.length)];
        user_id = 1 + sellerCount + Math.floor(Math.random() * customerCount);
        pairKey = `${review_id}_${user_id}`;
      } while (usedVotePairs.has(pairKey));
      usedVotePairs.add(pairKey);
      reviewVotes.push({
        review_id,
        user_id,
        vote_type: Math.random() < 0.5 ? 'helpful' : 'not_helpful',
        createdAt: now,
        updatedAt: now,
      });
    }
    await queryInterface.bulkInsert('ReviewVotes', reviewVotes);

    // --- Add 1000 pending and 1000 rejected products (with images and ModerationQueue) ---
    const pendingProducts = [];
    const rejectedProducts = [];
    const pendingImages = [];
    const rejectedImages = [];
    const pendingModeration = [];
    const rejectedModeration = [];
    for (let i = 1; i <= 1000; i++) {
      const seller_id = 2 + ((i - 1) % sellerCount);
      const category_id = categories[(i - 1) % categories.length];
      const baseIdx = productCount + i;
      pendingProducts.push({
        seller_id,
        category_id,
        name: `Pending Product ${i}`,
        description: `Description for Pending Product ${i}.`,
        price: (Math.random() * 500 + 10).toFixed(2),
        stock_quantity: Math.floor(Math.random() * 100) + 1,
        preview_image_url: `https://picsum.photos/seed/pending${i}/400/400`,
        createdAt: now,
        updatedAt: now,
      });
      // Images for pending
      pendingImages.push(
        {
          product_id: baseIdx,
          url: `https://picsum.photos/seed/pending${i}-main/600/600`,
          image_type: 'preview',
          display_order: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          product_id: baseIdx,
          url: `https://picsum.photos/seed/pending${i}-thumb/200/200`,
          image_type: 'thumbnail',
          display_order: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          product_id: baseIdx,
          url: `https://picsum.photos/seed/pending${i}-g1/400/400`,
          image_type: 'gallery',
          display_order: 2,
          createdAt: now,
          updatedAt: now,
        },
        {
          product_id: baseIdx,
          url: `https://picsum.photos/seed/pending${i}-g2/400/400`,
          image_type: 'gallery',
          display_order: 3,
          createdAt: now,
          updatedAt: now,
        }
      );
      pendingModeration.push({
        product_id: baseIdx,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      });
      // Rejected
      const rejIdx = productCount + 1000 + i;
      rejectedProducts.push({
        seller_id,
        category_id,
        name: `Rejected Product ${i}`,
        description: `Description for Rejected Product ${i}.`,
        price: (Math.random() * 500 + 10).toFixed(2),
        stock_quantity: Math.floor(Math.random() * 100) + 1,
        preview_image_url: `https://picsum.photos/seed/rejected${i}/400/400`,
        createdAt: now,
        updatedAt: now,
      });
      rejectedImages.push(
        {
          product_id: rejIdx,
          url: `https://picsum.photos/seed/rejected${i}-main/600/600`,
          image_type: 'preview',
          display_order: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          product_id: rejIdx,
          url: `https://picsum.photos/seed/rejected${i}-thumb/200/200`,
          image_type: 'thumbnail',
          display_order: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          product_id: rejIdx,
          url: `https://picsum.photos/seed/rejected${i}-g1/400/400`,
          image_type: 'gallery',
          display_order: 2,
          createdAt: now,
          updatedAt: now,
        },
        {
          product_id: rejIdx,
          url: `https://picsum.photos/seed/rejected${i}-g2/400/400`,
          image_type: 'gallery',
          display_order: 3,
          createdAt: now,
          updatedAt: now,
        }
      );
      rejectedModeration.push({
        product_id: rejIdx,
        status: 'rejected',
        createdAt: now,
        updatedAt: now,
      });
    }
    await queryInterface.bulkInsert('Products', pendingProducts);
    await queryInterface.bulkInsert('Products', rejectedProducts);
    await queryInterface.bulkInsert('ProductImages', pendingImages);
    await queryInterface.bulkInsert('ProductImages', rejectedImages);
    await queryInterface.bulkInsert('ModerationQueue', pendingModeration);
    await queryInterface.bulkInsert('ModerationQueue', rejectedModeration);

    // Fetch all real product IDs after all products are inserted
    const [productRows] = await queryInterface.sequelize.query(
      'SELECT id FROM Products'
    );
    const realProductIds = productRows.map((r) => r.id);

    // --- ShoppingCarts: one per customer ---
    const shoppingCarts = [];
    for (let i = 1; i <= customerCount; i++) {
      const customer_id = 1 + sellerCount + (i - 1);
      shoppingCarts.push({
        customer_id,
        createdAt: now,
        updatedAt: now,
      });
    }
    await queryInterface.bulkInsert('ShoppingCarts', shoppingCarts);
    // Fetch real cart IDs
    const [cartRows] = await queryInterface.sequelize.query(
      'SELECT id, customer_id FROM ShoppingCarts'
    );
    const realCartIds = cartRows.map((r) => r.id);

    // --- CartItems: up to 10,000 items, unique (cart_id, product_id) ---
    const cartItems = [];
    const usedCartProductPairs = new Set();
    let cartItemAttempts = 0;
    while (cartItems.length < 10000 && cartItemAttempts < 20000) {
      const cart_id =
        realCartIds[Math.floor(Math.random() * realCartIds.length)];
      const product_id =
        realProductIds[Math.floor(Math.random() * realProductIds.length)];
      const pairKey = `${cart_id}_${product_id}`;
      if (!usedCartProductPairs.has(pairKey)) {
        usedCartProductPairs.add(pairKey);
        cartItems.push({
          cart_id,
          product_id,
          quantity: Math.floor(Math.random() * 3) + 1,
          unit_price: (Math.random() * 500 + 10).toFixed(2),
          createdAt: now,
          updatedAt: now,
        });
      }
      cartItemAttempts++;
    }
    await queryInterface.bulkInsert('CartItems', cartItems);

    // --- Shipping: one per order ---
    const shipping = [];
    for (let i = 0; i < realOrderIds.length; i++) {
      const order_id = realOrderIds[i];
      shipping.push({
        order_id,
        shipping_address: `123 Test St Apt ${i}, City, Country`,
        shipping_status: 'delivered',
        shipped_date: now,
        expected_delivery: now,
        tracking_number: `TRACK${i}`,
        carrier: 'TestCarrier',
        createdAt: now,
        updatedAt: now,
      });
    }
    await queryInterface.bulkInsert('Shipping', shipping);

    // --- Payments: one per order, unique transaction_id ---
    const payments = [];
    for (let i = 0; i < realOrderIds.length; i++) {
      const order_id = realOrderIds[i];
      payments.push({
        order_id,
        payment_method: 'Credit Card',
        amount: (Math.random() * 1000 + 50).toFixed(2),
        status: 'succeeded',
        payment_date: now,
        transaction_id: `TXN${order_id}`,
        createdAt: now,
        updatedAt: now,
      });
    }
    await queryInterface.bulkInsert('Payments', payments);
  },

  down: async (queryInterface, Sequelize) => {
    // Delete in dependency order to avoid FK errors
    await queryInterface.bulkDelete('ReviewVotes', null, {});
    await queryInterface.bulkDelete('Reviews', null, {});
    await queryInterface.bulkDelete('Disputes', null, {});
    await queryInterface.bulkDelete('OrderItems', null, {});
    await queryInterface.bulkDelete('Orders', null, {});
    await queryInterface.bulkDelete('ProductImages', null, {});
    await queryInterface.bulkDelete('ModerationQueue', null, {});
    await queryInterface.bulkDelete('Products', null, {});
    await queryInterface.bulkDelete('Users', null, {});
    await queryInterface.bulkDelete('ProductCategories', null, {});
    await queryInterface.bulkDelete('Payments', null, {});
    await queryInterface.bulkDelete('Shipping', null, {});
    await queryInterface.bulkDelete('CartItems', null, {});
    await queryInterface.bulkDelete('ShoppingCarts', null, {});
  },
};
