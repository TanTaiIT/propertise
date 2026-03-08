import express from "express";
import {
  authenticate,
  optionalAuth,
  authorize,
  validateObjectId,
  asyncHandler
} from "../middlewares/index.js";
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost
} from "../controllers/post.controller.js";

const router = express.Router();

router.get("/", optionalAuth, asyncHandler(getPosts));
router.get("/:id", validateObjectId(), optionalAuth, asyncHandler(getPostById));

router.post("/", authenticate, asyncHandler(createPost));
router.put("/:id", authenticate, validateObjectId(), asyncHandler(updatePost));
router.delete("/:id", authenticate, authorize("admin", "moderator"), validateObjectId(), asyncHandler(deletePost));

export default router;
