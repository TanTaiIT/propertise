import express from "express";
import {
  requestId,
  security,
  corsConfig,
  rateLimiter,
  requestLogger,
  notFound,
  errorHandler
} from "./middlewares/index.js";

import postRoutes from "./routes/post.routes.js";
import authRouter from "./routes/authenticate.route.js";
import userRouter from "./routes/user.routes.js";
import packageRoutes from "./routes/package.route.js";
import likeRoutes from "./routes/like.route.js";
import paymentRouter from "./routes/payment.route.js";
import notificationRouter from "./routes/notification.route.js";
import bannerRouter from "./routes/banner.route.js";
const app = express();

// ── System Middleware (applied globally, order matters) ────
app.use(requestId);
app.use(security());
app.use(corsConfig());
app.use(rateLimiter());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(requestLogger());

// ── Health check (no auth required) ───────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── API Routes ────────────────────────────────────────────
app.use("/api/posts", postRoutes);
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/packages", packageRoutes);
app.use("/api/like", likeRoutes);
app.use("/api/payment", paymentRouter)
app.use("/api/notifications", notificationRouter)
app.use("/api/banners", bannerRouter)

// ── Error Middleware (must be last) ───────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
