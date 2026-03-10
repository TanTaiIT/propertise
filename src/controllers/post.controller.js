import fs from "fs/promises";
import path from "path";
import * as postService from "../services/post.service.js";

const UPLOAD_TEMP = path.join(process.cwd(), "uploads", "temp");

export async function createPost(req, res) {
  const { title, content, summary, authorName, authorPhone, tags, listingPackageId, address, location, property } =
    req.body;

  const mediaFiles = req.files?.media || [];
  const pendingMediaJobId = mediaFiles.length > 0 ? req.uploadJobId : null;

  try {
    const post = await postService.createPost({
      authorId: req.user._id,
      user: req.user,
      data: { title, content, summary, authorName, authorPhone, tags, listingPackageId, address, location, property },
      media: [],
      pendingMediaJobId
    });

    res.status(201).json({
      status: "success",
      message: "Post created successfully. Images are uploading in the background.",
      data: post
    });
  } catch (err) {
    if (pendingMediaJobId) {
      try {
        await fs.rm(path.join(UPLOAD_TEMP, pendingMediaJobId), { recursive: true });
      } catch {
        /* ignore */
      }
    }
    throw err;
  }
}

export async function getPosts(req, res) {
  const pageNumber = parseInt(req.body?.pageNumber, 10) || parseInt(req.query?.pageNumber, 10) || 1;
  const result = await postService.getPosts({
    pageNumber,
    status: req.query?.status,
    search: req.query?.search
  });
  return res.json(result);
}

export async function getPostById(req, res) {
  const postId = req.body?.postId || req.params?.id;
  const post = await postService.getPostById(postId);
  return res.json(post);
}

export async function updatePost(req, res) {
  const postId = req.params?.id || req.body?.postId;
  const post = await postService.updatePost(postId, { ...req.body });
  return res.json(post);
}

export async function deletePost(req, res) {
  const postId = req.body?.postId || req.params?.id;
  await postService.deletePost(postId);
  return res.json({
    status: "success",
    message: "Post deleted successfully"
  });
}
