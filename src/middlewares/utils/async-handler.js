/**
 * Wraps an async route handler to automatically catch errors
 * and forward them to Express error-handling middleware.
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default asyncHandler;
