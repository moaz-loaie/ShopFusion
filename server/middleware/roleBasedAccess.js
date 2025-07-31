const AppError = require('../utils/AppError');

/**
 * Middleware to handle role-based product access
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const roleBasedAccess = (req, res, next) => {
  const { user } = req;
  const { status } = req.query;

  // If no user (guest) or customer, only allow viewing approved products
  if (!user || user.role === 'customer') {
    req.query.status = 'approved';
    return next();
  }

  // Admin can see all products regardless of status
  if (user.role === 'admin') {
    return next();
  }

  // Seller can see all approved products plus their own pending/rejected
  if (user.role === 'seller') {
    if (!status || status === 'all') {
      req.query.where = {
        [Op.or]: [
          { status: 'approved' },
          { 
            [Op.and]: [
              { seller_id: user.id },
              { status: { [Op.in]: ['pending', 'rejected'] } }
            ]
          }
        ]
      };
    } else if (['pending', 'rejected'].includes(status)) {
      // If filtering by pending/rejected, only show seller's own products
      req.query.where = {
        seller_id: user.id,
        status
      };
    }
    return next();
  }

  next();
};

module.exports = roleBasedAccess;
