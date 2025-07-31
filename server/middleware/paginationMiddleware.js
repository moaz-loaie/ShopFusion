const logger = require("../utils/logger");
const { query, validationResult } = require('express-validator');

const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1-100")
    .toInt(),
];

const paginationMiddleware = (defaultLimit = 10, maxLimit = 100) => {
  return async (req, res, next) => {
    try {
      // First run the validation
      await Promise.all(validatePagination.map(validation => validation.run(req)));
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid pagination parameters',
          errors: errors.array()
        });
      }

      // If validation passes, set up pagination
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(
        parseInt(req.query.limit, 10) || defaultLimit,
        maxLimit
      );
      const offset = (page - 1) * limit;

      // Add pagination object to request
      req.pagination = {
        page,
        limit,
        offset,
      };

      logger.debug("Pagination middleware:", {
        page,
        limit,
        offset,
        path: req.originalUrl,
      });

      next();
    } catch (error) {
      logger.error("Error in pagination middleware:", error);
      next(error);
    }
  };
};

const paginateResults = (query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const offset = (page - 1) * limit;

  return {
    limit,
    offset,
    distinct: true,
  };
};

module.exports = {
  paginationMiddleware,
  paginateResults
};
