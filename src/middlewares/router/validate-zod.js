import AppError from "../utils/app-error.js";

/**
 * Validates request data using a Zod schema.
 * On success, replaces req[source] with the parsed (and possibly transformed) data.
 *
 * @param {import("zod").ZodType} schema - Zod schema (z.object, z.string, etc.)
 * @param {"body"|"query"|"params"} source - Which part of the request to validate
 *
 * @example
 *   import { registerSchema } from "../validations/user.validation.js";
 *   router.post("/register", validateZod(registerSchema, "body"), register);
 */
function validateZod(schema, source = "body") {
  return (req, _res, next) => {
    const data = req[source] || {};

    const result = schema.safeParse(data);

    if (result.success) {
      req[source] = result.data;
      return next();
    }

    const details = result.error.issues.map((issue) => ({
      path: issue.path.join(".") || source,
      message: issue.message
    }));

    next(AppError.badRequest("Validation failed.", details));
  };
}

export default validateZod;
