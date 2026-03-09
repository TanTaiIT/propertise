import { Router } from 'express'
import { asyncHandler, authenticate, validateZod } from "../middlewares/index.js";
import { getProfile, updateAvartar, updateProfile, updatePassword } from '../controllers/user.controller.js';
import { updateProfileSchema, changePasswordSchema } from '../validations/user.validation.js';
import { upload } from '../middlewares/upload/upload.middleware.js';
const userRouter = Router()

userRouter.get('/profile', authenticate, asyncHandler(getProfile))
userRouter.put('/update-avatar', authenticate, upload.single('avatar'), asyncHandler(updateAvartar))
userRouter.put('/update-profile', authenticate, validateZod(updateProfileSchema, 'body'), asyncHandler(updateProfile))
userRouter.put('/update-password', authenticate, validateZod(changePasswordSchema, 'body'), asyncHandler(updatePassword))
export default userRouter