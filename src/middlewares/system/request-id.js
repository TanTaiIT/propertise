import crypto from "crypto";

/**
 * Attaches a unique request ID to every incoming request.
 * If the client sends an `X-Request-Id` header, it is reused;
 * otherwise a new UUID v4 is generated.
 * The ID is also set on the response for easy correlation.
 */
function requestId(req, res, next) {
  const id = req.headers["x-request-id"] || crypto.randomUUID();
  req.id = id;
  res.setHeader("X-Request-Id", id);
  next();
}

export default requestId;
