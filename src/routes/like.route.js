import { Router } from "express"
import  { likePost, unlikePost } from "../controllers/Like.controller.js"
import { authenticate, asyncHandler } from "../middlewares/index.js"
const likeRouter = Router()

likeRouter.post("/", authenticate, asyncHandler(likePost))
likeRouter.delete("/", authenticate, asyncHandler(unlikePost))
export default likeRouter