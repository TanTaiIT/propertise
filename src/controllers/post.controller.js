import Post from "../models/post.model.js"
import { AppError } from "../middlewares/index.js"
import { uploadBuffer } from "../middlewares/utils/common.js"
import UserPackage from "../models/user-package.model.js"
import { STATUS, POST_STATUS, ROLE, PAGINATION } from "../config/system.js"
export async function createPost(req, res) {
  const { title, content, summary, authorName, authorPhone, tags, listingPackageId, address, location, property } = req.body;

  const mediaFiles = req.files?.media || []
  const mediaUrls = await Promise.all(mediaFiles.map(async (file) => {
    const upload = await uploadBuffer(file)
    return {
      url: upload.secure_url,
      sortOrder: mediaFiles.indexOf(file) + 1
    }
  }))
  const userPackage = await UserPackage.findOne({ userId: req.user._id, status: STATUS.ACTIVE, endDate: { $gt: new Date() } }).populate('listingPackageId')
  let isFeatured = false
  let featuredUntil = null
  let status = POST_STATUS.PENDING
  if(userPackage) {
    isFeatured = true
    featuredUntil = new Date(Date.now() + userPackage.listingPackageId?.durationDays ?? 0 * 24 * 60 * 60 * 1000)
  }

  const user = req.user
  // ADMIN
  if(user.role === ROLE.ADMIN) {
    status = POST_STATUS.PUBLISHED
  }

  const post = await Post.create({
    authorId: req.user._id,
    tags,
    title,
    media: mediaUrls,
    status,
    address,
    content,
    summary,
    location,
    property,
    isFeatured,
    authorName,
    authorPhone,
    featuredUntil,
    listingPackageId,
    publishedAt: new Date(),
    expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  })
  res.status(201).json({
    status: 'success',
    message: 'Post created successfully',
    data: post
  })
}

export async function getPosts(req, res) {
  const { pageNumber } = req.body
  const skip = (pageNumber - 1) * PAGINATION.limit;

  const query = {}
  if (req.query.status) {
    query.status = req.query.status
  }
  if (req.query.search) {
    const regex = new RegExp(req.query.search, "i")
    query.$or = [{ title: regex }, { content: regex }, { author: regex }]
  }

  const [items, total] = await Promise.all([
    Post.find(query).sort({ createdAt: -1 }).skip(skip).limit(PAGINATION.limit),
    Post.countDocuments(query)
  ])

  return res.json({
    items,
    pagination: {
      page: pageNumber,
      limit: PAGINATION.limit,
      total,
      totalPages: Math.ceil(total / PAGINATION.limit)
    }
  })
}

export async function getPostById(req, res) {
  const { postId } = req.body
  const post = await Post.findById(postId)
  if (!post) {
    throw AppError.notFound("Post not found.")
  }

  return res.json(post)
}

export async function updatePost(req, res) {
  const updates = { ...req.body }

  if (updates.status === "published" && !updates.publishedAt) {
    updates.publishedAt = new Date()
  }
  if (updates.status === "draft") {
    updates.publishedAt = null
  }

  const post = await Post.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true
  })

  if (!post) {
    throw AppError.notFound("Post not found.")
  }

  return res.json(post)
}

export async function deletePost(req, res) {
  const { postId } = req.body
  const post = await Post.findByIdAndDelete(postId)
  if (!post) {
    throw AppError.notFound("Post not found.")
  }

  return res.status(204).send()
}
