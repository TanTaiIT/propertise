import { Router } from "express"
import {
  RegisterController,
  LoginController,
  verifyEmail,
  refreshTokenController,
  logoutController,
} from "../controllers/auth.controller.js"
import { asyncHandler, validateZod, authLimiter, authenticate } from "../middlewares/index.js"
import { registerSchema, loginSchema } from "../validations/user.validation.js"

const authRouter = Router()

authRouter.post(
  "/register",
  authLimiter(),
  validateZod(registerSchema, "body"),
  asyncHandler(RegisterController)
)

authRouter.post(
  "/login",
  authLimiter(),
  validateZod(loginSchema, "body"),
  asyncHandler(LoginController)
)

authRouter.post("/verify-email", asyncHandler(verifyEmail))

// Refresh token - no auth required, uses the refresh token itself
authRouter.post("/refresh-token", asyncHandler(refreshTokenController))

// Logout - authenticated, optionally accepts a refreshToken to revoke
authRouter.post("/logout", authenticate, asyncHandler(logoutController))

export default authRouter
