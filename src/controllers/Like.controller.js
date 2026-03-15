import Like from "../models/Like.model.js"
import { AppError } from "../middlewares/index.js"
const likePost = async (req, res) => {
    const { postId } = req.body
    const like = await Like.create({ userId: req.user._id, postId })
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