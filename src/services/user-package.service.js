import UserPackage from "../models/user-package.model.js";
import ListingPackage from "../models/listing-package.model.js";
import Post from "../models/post.model.js";
import { AppError } from "../middlewares/index.js";
import { getFreePackage } from "./listing-package.service.js";
import { PACKAGE_CODES } from "../config/package-codes.js";

const USER_PACKAGE_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  EXPIRED: "expired"
};

/**
 * Lấy UserPackage đang active của user.
 * Package active: status="active" và endDate > now.
 *
 * @param {import("mongoose").Types.ObjectId} userId
 * @param {import("mongoose").Types.ObjectId} [listingPackageId] - Nếu có, chỉ lấy package của listingPackageId này
 * @returns {Promise<import("mongoose").Document|null>}
 */
export async function getActiveUserPackage(userId, listingPackageId = null) {
  const query = {
    userId,
    status: USER_PACKAGE_STATUS.ACTIVE,
    endDate: { $gt: new Date() }
  };
  if (listingPackageId) {
    query.listingPackageId = listingPackageId;
  }

  return UserPackage.findOne(query)
    .populate("listingPackageId")
    .sort({ endDate: -1 }) // Package mới hơn ưu tiên
    .lean();
}

/**
 * Đếm số Post đã dùng UserPackage (đã consume slot).
 *
 * @param {import("mongoose").Types.ObjectId} userPackageId
 * @returns {Promise<number>}
 */
export async function getUsedPostCount(userPackageId) {
  return Post.countDocuments({ userPackageId });
}

/**
 * Kiểm tra UserPackage còn slot để tạo post hay không.
 * Slot = maxPosts - số Post đã có userPackageId.
 *
 * @param {object} userPackage - UserPackage đã populate listingPackageId
 * @returns {Promise<{ hasSlot: boolean; used: number; max: number }>}
 */
export async function checkPackageSlot(userPackage) {
  if (!userPackage?._id) {
    return { hasSlot: false, used: 0, max: 0 };
  }

  // const max = userPackage.listingPackageId?.maxPosts ?? 1;
  const max = userPackage.remainingPosts ?? 0
  const used = await getUsedPostCount(userPackage._id);

  return {
    hasSlot: used < max,
    used,
    max
  };
}

/**
 * Tính thông tin featured cho post dựa trên UserPackage.
 * featuredUntil = now + durationDays (ms).
 *
 * @param {object} userPackage - UserPackage đã populate listingPackageId
 * @returns {{ isFeatured: boolean; featuredUntil: Date|null }}
 */
/**
 * Tính featured info từ package (UserPackage đã populate hoặc ListingPackage trực tiếp).
 *
 * @param {object} source - { listingPackageId: {...} } hoặc { listingPackage: {...} }
 */
export function getFeaturedInfo(userPackage) {
  const pkg =
    userPackage?.listingPackageId ?? userPackage?.listingPackage ?? userPackage;
  if (!pkg?.durationDays) {
    return { isFeatured: false, featuredUntil: null };
  }

  const isFeatured = pkg.packageType !== "free";
  const durationMs = (pkg.durationDays ?? 0) * 24 * 60 * 60 * 1000;
  return {
    isFeatured,
    featuredUntil: isFeatured ? new Date(Date.now() + durationMs) : null
  };
}

/**
 * Resolve UserPackage và featured info khi user tạo post.
 * - Nếu có listingPackageId: tìm package active của package đó, check slot.
 * - Nếu không: tìm bất kỳ active package nào còn slot.
 *
 * @param {import("mongoose").Types.ObjectId} userId
 * @param {import("mongoose").Types.ObjectId|null} listingPackageId
 * @returns {Promise<{ userPackage: object; featuredInfo: { isFeatured: boolean; featuredUntil: Date|null }; slot: { used: number; max: number } }|null>}
 */
export async function resolveUserPackageForPost(userId, listingPackageId = null) {
  const userPackage = await getActiveUserPackage(userId, listingPackageId);

  if (!userPackage) {
    return null;
  }

  const slot = await checkPackageSlot(userPackage);
  if (!slot.hasSlot) {
    throw AppError.forbidden(
      `Package slot limit reached (${slot.used}/${slot.max} posts used).`
    );
  }

  const featuredInfo = getFeaturedInfo(userPackage);

  return {
    userPackage,
    featuredInfo,
    slot
  };
}

/**
 * Đếm số post free của user (posts không dùng UserPackage).
 * Free posts = posts có userPackageId = null, dùng cho giới hạn tin thường.
 *
 * @param {import("mongoose").Types.ObjectId} userId
 * @returns {Promise<number>}
 */
export async function getFreePostCount(userId) {
  return Post.countDocuments({
    authorId: userId,
    userPackageId: null
  });
}

/**
 * Kiểm tra user còn slot free hay không.
 * Dựa vào FREE package config (maxPosts) và số post free hiện có.
 *
 * @param {import("mongoose").Types.ObjectId} userId
 * @returns {Promise<{ hasSlot: boolean; used: number; max: number; freePackage: object|null }>}
 */
export async function checkFreePostSlot(userId) {
  const freePackage = await getFreePackage();
  if (!freePackage) {
    return { hasSlot: false, used: 0, max: 0, freePackage: null };
  }

  const max = freePackage.maxPosts ?? 1;
  const used = await getFreePostCount(userId);

  return {
    hasSlot: used < max,
    used,
    max,
    freePackage
  };
}

/**
 * Resolve thông tin package cho post: hỗ trợ cả FREE và paid package.
 * - listingPackageId null/undefined hoặc = FREE: dùng free slot.
 * - listingPackageId = paid: dùng UserPackage nếu còn slot.
 *
 * @param {import("mongoose").Types.ObjectId} userId
 * @param {import("mongoose").Types.ObjectId|null|string} listingPackageId
 * @returns {Promise<{ type: "free"|"paid"; userPackage?: object; listingPackage: object; featuredInfo: object; slot: object; priorityScore: number }>}
 */
export async function resolvePostPackage(userId, listingPackageId = null) {
  const freePackage = await getFreePackage();

  const useFreeTier =
    !listingPackageId ||
    (freePackage && String(listingPackageId) === String(freePackage._id)) ||
    (freePackage && listingPackageId === PACKAGE_CODES.FREE);

  if (useFreeTier) {
    if (!freePackage) {
      throw AppError.badRequest(
        "Free tier is not configured. Please select a paid package or contact admin."
      );
    }
    const slot = await checkFreePostSlot(userId);
    if (!slot.hasSlot) {
      throw AppError.forbidden(
        `Free post limit reached (${slot.used}/${slot.max}). Upgrade to post more.`
      );
    }
    const featuredInfo = getFeaturedInfo({ listingPackageId: freePackage });
    return {
      type: "free",
      listingPackage: freePackage,
      featuredInfo,
      slot,
      priorityScore: freePackage.priorityScore ?? 0,
      userPackageId: null
    };
  }

  const resolved = await resolveUserPackageForPost(userId, listingPackageId);
  if (!resolved) {
    throw AppError.badRequest(
      "No active package found. Please purchase a package or use free tier."
    );
  }

  const pkg = resolved.userPackage.listingPackageId;
  return {
    type: "paid",
    userPackage: resolved.userPackage,
    listingPackage: pkg,
    featuredInfo: resolved.featuredInfo,
    slot: resolved.slot,
    priorityScore: pkg?.priorityScore ?? 0,
    userPackageId: resolved.userPackage._id
  };
}

/**
 * Tạo UserPackage khi thanh toán thành công (gọi từ webhook/order flow).
 *
 * @param {object} params
 * @param {import("mongoose").Types.ObjectId} params.userId
 * @param {import("mongoose").Types.ObjectId} params.listingPackageId
 * @returns {Promise<import("mongoose").Document>}
 */
export async function createUserPackageOnPaymentSuccess({ userId, listingPackageId }) {
  const pkg = await ListingPackage.findById(listingPackageId);
  if (!pkg) {
    throw AppError.badRequest("Listing package not found.");
  }

  const now = new Date();
  const endDate = new Date(
    now.getTime() + (pkg.durationDays || 1) * 24 * 60 * 60 * 1000
  );

  return UserPackage.create({
    userId,
    listingPackageId,
    startDate: now,
    endDate,
    status: USER_PACKAGE_STATUS.ACTIVE
  });
}
