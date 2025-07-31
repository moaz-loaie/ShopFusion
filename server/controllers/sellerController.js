const { Op, Sequelize } = require('sequelize');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const {
  Product,
  Order,
  OrderItem,
  ModerationQueue,
  User,
  Review,
  Payment
} = require('../models');

exports.getDashboardStats = catchAsync(async (req, res, next) => {
  const sellerId = req.user.id;

  logger.debug(`Fetching dashboard stats for seller ${sellerId}`);

  const [
    productStats,
    orderStats,
    reviewStats,
    recentOrders,
    performanceStats,
    revenueHistory
  ] = await Promise.all([
    // Product statistics with moderation status
    Product.findAll({
      attributes: [
        [Sequelize.col('ModerationQueue.status'), 'status'],
        [Sequelize.fn('COUNT', Sequelize.col('Product.id')), 'count'],
        [Sequelize.literal(`
          SUM(CASE 
            WHEN Product.stock_quantity <= Product.low_stock_threshold THEN 1 
            ELSE 0 
          END)`), 'lowStockCount']
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
        seller_id: sellerId,
        is_active: true,
        deletedAt: null
      },
      group: ['ModerationQueue.status'],
      raw: true
    }),

    // Order statistics with revenue calculation
    OrderItem.findAll({
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('Order.id'))), 'count'],
        [Sequelize.fn('SUM', Sequelize.col('OrderItem.subtotal')), 'revenue'],
        [Sequelize.literal(`COUNT(DISTINCT CASE WHEN Order.status = 'completed' THEN Order.id END)`), 'completed_count'],
        [Sequelize.fn('DATE_TRUNC', 'day', Sequelize.col('Order.createdAt')), 'date'],
        [Sequelize.literal(`COUNT(DISTINCT CASE WHEN Order.status = 'cancelled' THEN Order.id END)`), 'cancelled_count']
      ],
      include: [{
        model: Order,
        attributes: [],
        where: {
          status: { [Op.ne]: 'draft' },
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        required: true
      }, {
        model: Product,
        attributes: [],
        where: { seller_id: sellerId },
        required: true
      }],
      group: [Sequelize.fn('DATE_TRUNC', 'day', Sequelize.col('Order.createdAt'))],
      order: [[Sequelize.fn('DATE_TRUNC', 'day', Sequelize.col('Order.createdAt')), 'DESC']],
      raw: true
    }),

    // Review statistics with rating distribution
    Review.findAll({
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('Review.id')), 'count'],
        [Sequelize.fn('AVG', Sequelize.col('Review.rating')), 'averageRating'],
        [Sequelize.col('Review.rating'), 'rating'],
        [Sequelize.literal(`COUNT(CASE WHEN Review.rating >= 4 THEN 1 END)`), 'positive_count']
      ],
      include: [{
        model: Product,
        attributes: [],
        where: { seller_id: sellerId },
        required: true
      }],
      group: ['Review.rating'],
      raw: true
    }),

    // Recent orders with detailed info
    Order.findAll({
      attributes: [
        'id',
        'status',
        'createdAt',
        [Sequelize.fn('SUM', Sequelize.col('OrderItems.subtotal')), 'total']
      ],
      include: [{
        model: OrderItem,
        as: 'OrderItems',
        attributes: [],
        include: [{
          model: Product,
          where: { seller_id: sellerId },
          attributes: [],
          required: true
        }],
        required: true
      }],
      where: {
        status: { [Op.ne]: 'draft' }
      },
      group: ['Order.id'],
      order: [['createdAt', 'DESC']],
      limit: 5,
      raw: true
    }),

    // Performance metrics
    Promise.all([
      // Conversion rate trend
      OrderItem.findAll({
        attributes: [
          [Sequelize.fn('DATE_TRUNC', 'week', Sequelize.col('Order.createdAt')), 'week'],
          [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('Order.id'))), 'order_count'],
          [Sequelize.literal(`COUNT(DISTINCT CASE WHEN Order.status = 'completed' THEN Order.id END)`), 'completed_count']
        ],
        include: [{
          model: Order,
          attributes: [],
          where: {
            createdAt: {
              [Op.gte]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
            }
          },
          required: true
        }, {
          model: Product,
          attributes: [],
          where: { seller_id: sellerId },
          required: true
        }],
        group: [Sequelize.fn('DATE_TRUNC', 'week', Sequelize.col('Order.createdAt'))],
        order: [[Sequelize.fn('DATE_TRUNC', 'week', Sequelize.col('Order.createdAt')), 'DESC']],
        raw: true
      }),

      // Average order value trend
      OrderItem.findAll({
        attributes: [
          [Sequelize.fn('DATE_TRUNC', 'week', Sequelize.col('Order.createdAt')), 'week'],
          [Sequelize.fn('AVG', Sequelize.col('OrderItem.subtotal')), 'avg_order_value']
        ],
        include: [{
          model: Order,
          attributes: [],
          where: {
            status: 'completed',
            createdAt: {
              [Op.gte]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
            }
          },
          required: true
        }, {
          model: Product,
          attributes: [],
          where: { seller_id: sellerId },
          required: true
        }],
        group: [Sequelize.fn('DATE_TRUNC', 'week', Sequelize.col('Order.createdAt'))],
        order: [[Sequelize.fn('DATE_TRUNC', 'week', Sequelize.col('Order.createdAt')), 'DESC']],
        raw: true
      })
    ]),

    // Revenue history for chart
    OrderItem.findAll({
      attributes: [
        [Sequelize.fn('DATE_TRUNC', 'day', Sequelize.col('Order.createdAt')), 'date'],
        [Sequelize.fn('SUM', Sequelize.col('OrderItem.subtotal')), 'revenue']
      ],
      include: [{
        model: Order,
        attributes: [],
        where: {
          status: 'completed',
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        required: true
      }, {
        model: Product,
        attributes: [],
        where: { seller_id: sellerId },
        required: true
      }],
      group: [Sequelize.fn('DATE_TRUNC', 'day', Sequelize.col('Order.createdAt'))],
      order: [[Sequelize.fn('DATE_TRUNC', 'day', Sequelize.col('Order.createdAt')), 'ASC']],
      raw: true
    })
  ]);

  // Process product stats
  const products = {
    total: productStats.reduce((sum, stat) => sum + parseInt(stat.count || 0), 0),
    approved: productStats.find(stat => stat.status === 'approved')?.count || 0,
    pending: productStats.find(stat => stat.status === 'pending')?.count || 0,
    rejected: productStats.find(stat => stat.status === 'rejected')?.count || 0,
    lowStock: productStats.reduce((sum, stat) => sum + parseInt(stat.lowStockCount || 0), 0)
  };

  // Process order stats
  const orders = {
    count: orderStats.reduce((sum, stat) => sum + parseInt(stat.count || 0), 0),
    revenue: orderStats.reduce((sum, stat) => sum + parseFloat(stat.revenue || 0), 0).toFixed(2),
    completed: orderStats.reduce((sum, stat) => sum + parseInt(stat.completed_count || 0), 0),
    cancelled: orderStats.reduce((sum, stat) => sum + parseInt(stat.cancelled_count || 0), 0),
    dailyData: orderStats.map(stat => ({
      date: stat.date,
      orders: parseInt(stat.count || 0),
      revenue: parseFloat(stat.revenue || 0).toFixed(2)
    }))
  };

  // Process review stats
  const reviews = {
    count: reviewStats.reduce((sum, stat) => sum + parseInt(stat.count || 0), 0),
    averageRating: (
      reviewStats.reduce((sum, stat) => sum + (parseFloat(stat.rating) * parseInt(stat.count)), 0) /
      Math.max(reviewStats.reduce((sum, stat) => sum + parseInt(stat.count), 0), 1)
    ).toFixed(1),
    distribution: reviewStats.reduce((acc, stat) => {
      acc[stat.rating] = parseInt(stat.count);
      return acc;
    }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }),
    positiveRating: reviewStats.reduce((sum, stat) => {
      return sum + (stat.rating >= 4 ? parseInt(stat.count) : 0);
    }, 0)
  };

  // Format recent orders
  const formattedRecentOrders = recentOrders.map(order => ({
    id: order.id,
    total: parseFloat(order.total).toFixed(2),
    status: order.status,
    createdAt: order.createdAt
  }));

  // Calculate performance metrics
  const [conversionStats, avgOrderValueTrend] = performanceStats;
  const performance = {
    conversionRate: conversionStats[0]?.order_count > 0
      ? ((conversionStats[0].completed_count / conversionStats[0].order_count) * 100).toFixed(1)
      : 0,
    conversionTrend: {
      direction: conversionStats.length > 1
        ? conversionStats[0].completed_count / conversionStats[0].order_count >
          conversionStats[1].completed_count / conversionStats[1].order_count
          ? 'up' : 'down'
        : 'neutral',
      percentage: conversionStats.length > 1
        ? (((conversionStats[0].completed_count / conversionStats[0].order_count) -
            (conversionStats[1].completed_count / conversionStats[1].order_count)) * 100).toFixed(1)
        : 0
    },
    avgOrderValue: parseFloat(avgOrderValueTrend[0]?.avg_order_value || 0).toFixed(2),
    orderValueTrend: {
      direction: avgOrderValueTrend.length > 1
        ? parseFloat(avgOrderValueTrend[0].avg_order_value) >
          parseFloat(avgOrderValueTrend[1].avg_order_value)
          ? 'up' : 'down'
        : 'neutral',
      percentage: avgOrderValueTrend.length > 1
        ? (((parseFloat(avgOrderValueTrend[0].avg_order_value) -
            parseFloat(avgOrderValueTrend[1].avg_order_value)) /
            parseFloat(avgOrderValueTrend[1].avg_order_value)) * 100).toFixed(1)
        : 0
    },
    satisfactionRate: reviews.count > 0
      ? ((reviews.positiveRating / reviews.count) * 100).toFixed(1)
      : 0,
    satisfactionTrend: {
      direction: 'neutral',
      percentage: 0
    }
  };

  // Format revenue history for chart
  const revenueChartData = revenueHistory.map(entry => ({
    date: entry.date,
    revenue: parseFloat(entry.revenue || 0).toFixed(2)
  }));

  res.status(200).json({
    status: 'success',
    data: {
      products,
      orders,
      reviews,
      recentOrders: formattedRecentOrders,
      performance,
      revenueChart: revenueChartData
    }
  });
});

// ...existing code for other seller controller functions...
