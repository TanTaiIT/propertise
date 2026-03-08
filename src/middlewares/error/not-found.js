import AppError from "../utils/app-error.js";

/**
 * Catches requests to undefined routes and forwards a 404 error.
 * Must be registered AFTER all route definitions.
 */
function notFound(req, _res, next) {
  next(AppError.notFound(`Cannot ${req.method} ${req.originalUrl}`));
}

export default notFound;
