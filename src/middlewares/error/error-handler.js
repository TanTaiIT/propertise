import AppError from "../utils/app-error.js";

/**
 * Global error-handling middleware.
 * Normalises various error types into a consistent JSON response.
 */
function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      ...(err.details && { details: err.details })
    });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      status: "error",
      message: "Validation failed.",
      details: err.message
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      status: "error",
      message: `Invalid value for ${err.path}: ${err.value}`
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({
      status: "error",
      message: `Duplicate value for '${field}'. This ${field} already exists.`
    });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({
      status: "error",
      message: "Request body is too large."
    });
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      status: "error",
      message: "Malformed JSON in request body."
    });
  }

  const isDev = process.env.NODE_ENV !== "production";
  console.error(`[${req.id || "-"}] Unhandled Error:`, err);

  res.status(500).json({
    status: "error",
    message: "Internal server error.",
    ...(isDev && { stack: err.stack })
  });
}

export default errorHandler;
