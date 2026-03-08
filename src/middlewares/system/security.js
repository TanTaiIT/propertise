import helmet from "helmet";

/**
 * Configures Helmet security headers.
 * Returns a middleware array so it can be spread into app.use().
 */
function security() {
  return helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  });
}

export default security;
