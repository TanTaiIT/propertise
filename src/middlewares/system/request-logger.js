import morgan from "morgan";

/**
 * Custom Morgan token to include the request ID in logs.
 */
morgan.token("request-id", (req) => req.id || "-");

const LOG_FORMAT =
  ":request-id :method :url :status :res[content-length] - :response-time ms";

/**
 * Returns a request logger middleware.
 * Uses "dev" format in development, custom format otherwise.
 */
function requestLogger() {
  const isDev = process.env.NODE_ENV !== "production";
  return morgan(isDev ? "dev" : LOG_FORMAT);
}

export default requestLogger;
