// ── System middleware (global) ──────────────────────────────
import requestId from "./system/request-id.js";
import security from "./system/security.js";
import corsConfig from "./system/cors-config.js";
import { rateLimiter, authLimiter } from "./system/rate-limiter.js";
import requestLogger from "./system/request-logger.js";

// ── Router middleware (per-route) ──────────────────────────
import { authenticate, optionalAuth } from "./router/authenticate.js";
import authorize from "./router/authorize.js";
import { validate, validateObjectId } from "./router/validate.js";
import validateZod from "./router/validate-zod.js";

// ── Error middleware ───────────────────────────────────────
import notFound from "./error/not-found.js";
import errorHandler from "./error/error-handler.js";

// ── Utilities ──────────────────────────────────────────────
import AppError from "./utils/app-error.js";
import asyncHandler from "./utils/async-handler.js";

export {
  // System
  requestId,
  security,
  corsConfig,
  rateLimiter,
  authLimiter,
  requestLogger,

  // Router
  authenticate,
  optionalAuth,
  authorize,
  validate,
  validateObjectId,
  validateZod,

  // Error
  notFound,
  errorHandler,

  // Utils
  AppError,
  asyncHandler
};
