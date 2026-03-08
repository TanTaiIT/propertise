import AppError from "../utils/app-error.js";

/**
 * Generic request validation middleware.
 *
 * Accepts a `schema` object with optional keys: `body`, `query`, `params`.
 * Each key maps to a validation function that receives the corresponding
 * request data and returns `{ valid: true }` or `{ valid: false, errors: [...] }`.
 *
 * @example
 *   const createPostSchema = {
 *     body: (data) => {
 *       const errors = [];
 *       if (!data.title) errors.push("title is required.");
 *       if (!data.content) errors.push("content is required.");
 *       return errors.length ? { valid: false, errors } : { valid: true };
 *     }
 *   };
 *   router.post("/", validate(createPostSchema), createPost);
 */
function validate(schema) {
  return (req, _res, next) => {
    const allErrors = [];

    for (const source of ["params", "query", "body"]) {
      if (!schema[source]) continue;

      const result = schema[source](req[source] || {});
      if (!result.valid) {
        allErrors.push(
          ...result.errors.map((e) => (typeof e === "string" ? { source, message: e } : { source, ...e }))
        );
      }
    }

    if (allErrors.length > 0) {
      return next(AppError.badRequest("Validation failed.", allErrors));
    }

    next();
  };
}

/**
 * Validates that `req.params.id` is a valid MongoDB ObjectId.
 */
function validateObjectId(paramName = "id") {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;

  return (req, _res, next) => {
    const value = req.params[paramName];
    if (!value || !objectIdRegex.test(value)) {
      return next(AppError.badRequest(`Invalid ${paramName} format.`));
    }
    next();
  };
}

export { validate, validateObjectId };
