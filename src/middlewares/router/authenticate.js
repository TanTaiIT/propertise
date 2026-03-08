import jwt from "jsonwebtoken";
import User from "../../models/user.model.js";
import AppError from "../utils/app-error.js";

const JWT_SECRET = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables.");
  }
  return process.env.JWT_SECRET;
};

/**
 * Verifies the Bearer token from the Authorization header,
 * fetches the user from DB, and attaches `req.user`.
 */
async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw AppError.unauthorized("Access token is missing or malformed.");
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET());

    const user = await User.findById(decoded.sub).select("-passwordHash");
    if (!user) {
      throw AppError.unauthorized("User belonging to this token no longer exists.");
    }
    if (user.status !== "active") {
      throw AppError.forbidden("Your account has been deactivated.");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);

    if (error.name === "JsonWebTokenError") {
      return next(AppError.unauthorized("Invalid access token."));
    }
    if (error.name === "TokenExpiredError") {
      return next(AppError.unauthorized("Access token has expired."));
    }

    next(error);
  }
}

/**
 * Optionally authenticates the user if a token is present.
 * Does NOT throw if no token is provided — just continues without `req.user`.
 */
async function optionalAuth(req, _res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return next();
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET());
    const user = await User.findById(decoded.sub).select("-passwordHash");

    if (user && user.status === "active") {
      req.user = user;
    }

    next();
  } catch {
    next();
  }
}

export { authenticate, optionalAuth };
