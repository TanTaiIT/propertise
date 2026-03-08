import AppError from "../utils/app-error.js";

/**
 * Authorization middleware — restricts access to users whose role
 * is included in the given `allowedRoles` list.
 *
 * Must be used AFTER `authenticate` so that `req.user` exists.
 *
 * @param  {...string} allowedRoles  e.g. "admin", "moderator"
 *
 * @example
 *   router.delete("/:id", authenticate, authorize("admin"), deletePost);
 */
function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        AppError.forbidden("You do not have permission to perform this action.")
      );
    }

    next();
  };
}

export default authorize;
