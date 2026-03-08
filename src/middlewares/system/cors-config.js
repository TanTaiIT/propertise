import cors from "cors";

/**
 * CORS configuration.
 * In production, restrict `origin` to your actual domain(s).
 */
function corsConfig() {
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
    : "*";

  return cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    exposedHeaders: ["X-Request-Id", "X-RateLimit-Remaining"],
    credentials: allowedOrigins !== "*",
    maxAge: 86400
  });
}

export default corsConfig;
