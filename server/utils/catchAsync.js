/**
 * Wraps async route handlers to catch errors and pass them to the global error handler.
 * Avoids repetitive try...catch blocks in controllers.
 * @param {Function} fn - The async function (controller action) to wrap.
 * @returns {Function} Express middleware function.
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next); // Catches promise rejections and passes them to next()
  };
};

module.exports = catchAsync;
