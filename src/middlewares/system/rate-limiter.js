import rateLimit from "express-rate-limit";

/**
 * Global API rate limiter.
 * Default: 200 requests per 15-minute window per IP.
 */
function rateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000,
    max = 200,
    message = { message: "Too many requests, please try again later." }
  } = options;

  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false
  });
}

/**
 * Stricter limiter for auth endpoints (login, register).
 * Default: 15 attempts per 15-minute window per IP.
 */
function authLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000,
    max = 15,
    message = { message: "Too many authentication attempts, please try again later." }
  } = options;

  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false
  });
}

export { rateLimiter, authLimiter };
