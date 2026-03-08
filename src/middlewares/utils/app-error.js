class AppError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Bad request.", details = null) {
    return new AppError(400, message, details);
  }

  static unauthorized(message = "Unauthorized.") {
    return new AppError(401, message);
  }

  static forbidden(message = "Forbidden.") {
    return new AppError(403, message);
  }

  static notFound(message = "Resource not found.") {
    return new AppError(404, message);
  }

  static conflict(message = "Resource already exists.") {
    return new AppError(409, message);
  }

  static tooMany(message = "Too many requests, please try again later.") {
    return new AppError(429, message);
  }

  static internal(message = "Internal server error.") {
    return new AppError(500, message);
  }
}

export default AppError;
