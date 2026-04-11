import Like from "../models/Like.model.js"
import Post from "../models/post.model.js"
import { AppError } from "../middlewares/index.js"
import notificationService from "../services/notification.service.js"

const likePost = async (req, res) => {
    const { postId } = req.body

    // Check if post exists and get author
    const post = await Post.findById(postId).lean()
    if (!post) {
        throw AppError.notFound("Post not found")
    }

    // Check for duplicate like
    const existingLike = await Like.findOne({ userId: req.user._id, postId })
    if (existingLike) {
        throw AppError.conflict("You have already liked this post")
    }

    const like = await Like.create({ userId: req.user._id, postId })

    // Send notification to post author (if not liking own post)
    if (post.authorId.toString() !== req.user._id.toString()) {
        notificationService.notifyLikePost({
            recipientId: post.authorId,
            senderId: req.user._id,
            postId: post._id,
            postTitle: post.title,
        }).catch((err) => console.error("Failed to send like notification:", err))
    }

    res.status(201).json({
        status: "success",
        message: "Post liked successfully"
    })
}

const unlikePost = async(req, res) => {
    const { postId } = req.body
    const like = await Like.findOneAndDelete({ userId: req.user._id, postId })
    if(!like) {
        throw AppError.notFound("Like not found")
    }
    res.status(200).json({
        status: "success",
        message: "Post unliked successfully",
        data: {
            ...like
        }
    })
}

const getLikeList = async (req, res) => {
    const likeList = await Like.find({ userId: req.user._id })
    res.status(200).json({
        status: "success",
        message: "Like list fetched successfully",
        data: {
            ...likeList
        }
    })
}


export {
    likePost,
    unlikePost
} 