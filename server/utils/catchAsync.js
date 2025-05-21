/**
 * Wraps async Express route handlers/middleware to catch rejected promises
 * and pass them to the Express global error handler (via next(err)).
 * Avoids repetitive try...catch blocks in every async function.
 *
 * @param {Function} fn - The async function (controller action or middleware) to wrap.
 * @returns {Function} An Express middleware function that executes the async function and catches errors.
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    // Ensure fn call is caught and any rejection passed to next()
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = catchAsync;
