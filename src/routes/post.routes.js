import express from "express"
import {
  authenticate,
  optionalAuth,
  authorize,
  validateObjectId,
  asyncHandler
} from "../middlewares/index.js"
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost
} from "../controllers/post.controller.js"
import { validateZod } from "../middlewares/index.js"
import { postSchema } from "../validations/post.validation.js"
import { uploadTempFormData } from "../middlewares/upload/multer-temp-storage.js";
import { ROLE } from "../config/system.js";

const router = express.Router();
const multerForm = uploadTempFormData();
router.get("/", optionalAuth, asyncHandler(getPosts));
router.get("/:id", authenticate, validateObjectId(), optionalAuth, asyncHandler(getPostById));

router.post(
  "/",
  authenticate,
  multerForm.fields([{ name: "media", maxCount: 10 }]),
  validateZod(postSchema, "body"),
  asyncHandler(createPost)
);
router.put("/:id", authenticate, validateObjectId(), asyncHandler(updatePost));
router.delete("/", authenticate, authorize(ROLE.ADMIN), asyncHandler(deletePost));

export default router;
