/**
 * Wraps async route handlers so thrown errors propagate to the global error middleware.
 * Usage: router.get('/path', asyncWrapper(controller.method))
 */
const asyncWrapper = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncWrapper;
