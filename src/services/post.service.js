import Post from "../models/post.model.js";
import { AppError } from "../middlewares/index.js";
import { resolvePostPackage } from "./user-package.service.js";
import { POST_STATUS, ROLE, PAGINATION } from "../config/system.js";

const DEFAULT_POST_EXPIRY_DAYS = 10;

/**
 * Tạo post mới.
 * - Hỗ trợ FREE tier (1 tin/user) và paid package.
 * - Admin: auto publish.
 * - Denormalize priorityScore lên Post để sort hiệu quả.
 *
 * @param {object} params
 * @param {import("mongoose").Types.ObjectId} params.authorId
 * @param {object} params.user - req.user (để check role)
 * @param {object} params.data - { title, content, summary, authorName, authorPhone, tags, listingPackageId, address, location, property }
 * @param {Array<{url: string, sortOrder: number}>} params.media
 * @param {string} [params.pendingMediaJobId] - JobId thư mục temp khi dùng background upload
 * @returns {Promise<import("mongoose").Document>}
 */
export async function createPost({ authorId, user, data, media, pendingMediaJobId }) {
  const {
    title,
    content,
    summary,
    authorName,
    authorPhone,
    tags,
    listingPackageId,
    address,
    location,
    property
  } = data;

  const resolved = await resolvePostPackage(authorId, listingPackageId ?? null);

  const {
    userPackageId,
    featuredInfo,
    priorityScore,
    listingPackage
  } = resolved;

  const isFeatured = featuredInfo.isFeatured;
  const featuredUntil = featuredInfo.featuredUntil;

  let status = POST_STATUS.PENDING;
  if (user?.role === ROLE.ADMIN) {
    status = POST_STATUS.PUBLISHED;
  }

  const now = new Date();
  const durationDays = listingPackage?.durationDays ?? DEFAULT_POST_EXPIRY_DAYS;
  const expiresAt = new Date(
    now.getTime() + durationDays * 24 * 60 * 60 * 1000
  );

  const post = await Post.create({
    authorId,
    userPackageId,
    listingPackageId: listingPackage?._id ?? listingPackageId ?? null,
    title,
    content,
    summary: summary || "",
    authorName,
    authorPhone: authorPhone || null,
    tags: tags || [],
    media: media || [],
    pendingMediaJobId: pendingMediaJobId || null,
    status,
    address: address || null,
    location: location || {},
    property: property || {},
    isFeatured,
    featuredUntil,
    priorityScore,
    lastBoostedAt: priorityScore > 0 && status === POST_STATUS.PUBLISHED ? now : null,
    publishedAt: status === POST_STATUS.PUBLISHED ? now : null,
    expiresAt
  });

  return post;
}

/**
 * Lấy danh sách post với pagination và filter.
 */
export async function getPosts({ pageNumber = 1, status, search }) {
  const skip = (pageNumber - 1) * PAGINATION.limit;
  const query = {};

  if (status !== undefined) {
    query.status = status;
  }
  if (search) {
    const regex = new RegExp(search, "i");
    query.$or = [{ title: regex }, { content: regex }, { authorName: regex }];
  }

  const [items, total] = await Promise.all([
    Post.find(query)
      .sort({
        lastBoostedAt: -1,
        priorityScore: -1,
        createdAt: -1
      })
      .skip(skip)
      .limit(PAGINATION.limit),
    Post.countDocuments(query)
  ]);

  return {
    items,
    pagination: {
      page: pageNumber,
      limit: PAGINATION.limit,
      total,
      totalPages: Math.ceil(total / PAGINATION.limit)
    }
  };
}

/**
 * Lấy post theo ID.
 */
export async function getPostById(postId) {
  const post = await Post.findById(postId);
  if (!post) {
    throw AppError.notFound("Post not found.");
  }
  return post;
}

/**
 * Cập nhật post.
 */
export async function updatePost(postId, updates) {
  if (updates.status === POST_STATUS.PUBLISHED && !updates.publishedAt) {
    updates.publishedAt = new Date();
  }
  if (updates.status === POST_STATUS.DRAFT) {
    updates.publishedAt = null;
  }

  const post = await Post.findByIdAndUpdate(postId, updates, {
    new: true,
    runValidators: true
  });

  if (!post) {
    throw AppError.notFound("Post not found.");
  }
  return post;
}

/**
 * Xóa post.
 */
export async function deletePost(postId) {
  const post = await Post.findByIdAndDelete(postId);
  console.log('post', post)
  if (!post) {
    throw AppError.notFound("Post not found.");
  }
  return post;
}
