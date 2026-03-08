import Post from "../models/post.model.js";
import { AppError } from "../middlewares/index.js";

export async function createPost(req, res) {
  const post = await Post.create(req.body);
  return res.status(201).json(post);
}

export async function getPosts(req, res) {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const query = {};
  if (req.query.status) {
    query.status = req.query.status;
  }
  if (req.query.search) {
    const regex = new RegExp(req.query.search, "i");
    query.$or = [{ title: regex }, { content: regex }, { author: regex }];
  }

  const [items, total] = await Promise.all([
    Post.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Post.countDocuments(query)
  ]);

  return res.json({
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}

export async function getPostById(req, res) {
  const post = await Post.findById(req.params.id);
  if (!post) {
    throw AppError.notFound("Post not found.");
  }

  return res.json(post);
}

export async function updatePost(req, res) {
  const updates = { ...req.body };

  if (updates.status === "published" && !updates.publishedAt) {
    updates.publishedAt = new Date();
  }
  if (updates.status === "draft") {
    updates.publishedAt = null;
  }

  const post = await Post.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true
  });

  if (!post) {
    throw AppError.notFound("Post not found.");
  }

  return res.json(post);
}

export async function deletePost(req, res) {
  const post = await Post.findByIdAndDelete(req.params.id);
  if (!post) {
    throw AppError.notFound("Post not found.");
  }

  return res.status(204).send();
}
