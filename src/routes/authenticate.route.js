import { Router } from "express";
import { RegisterController, LoginController, verifyEmail } from "../controllers/auth.controller.js"
import { asyncHandler, validateZod, authLimiter } from "../middlewares/index.js"
import { registerSchema } from "../validations/user.validation.js"
import { loginSchema } from "../validations/user.validation.js"

const authRouter = Router();

authRouter.post(
  "/register",
  authLimiter(),
  validateZod(registerSchema, "body"),
  asyncHandler(RegisterController)
);

authRouter.post('/login', authLimiter(), validateZod(loginSchema, "body"), asyncHandler(LoginController))

authRouter.post('/verify-email', asyncHandler(verifyEmail))

export default authRouter;