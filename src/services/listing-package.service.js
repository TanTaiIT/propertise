import ListingPackage from "../models/listing-package.model.js";
import { AppError } from "../middlewares/index.js";
import { PACKAGE_CODES } from "../config/package-codes.js";

/**
 * Lấy ListingPackage theo code.
 *
 * @param {string} code - FREE, BASIC, PREMIUM, VIP, BOOST3
 * @returns {Promise<import("mongoose").Document|null>}
 */
export async function getByCode(code) {
  if (!code) return null;
  return ListingPackage.findOne({
    code: String(code).toUpperCase().trim(),
    isActive: true
  }).lean();
}

/**
 * Lấy gói FREE (tin thường) – dùng cho logic free tier.
 *
 * @returns {Promise<import("mongoose").Document|null>}
 */
export async function getFreePackage() {
  return getByCode(PACKAGE_CODES.FREE);
}

/**
 * Kiểm tra package có phải free (price = 0) hay không.
 *
 * @param {object} pkg - ListingPackage
 * @returns {boolean}
 */
export function isFreePackage(pkg) {
  return pkg && (pkg.price === 0 || pkg.code === PACKAGE_CODES.FREE);
}

/**
 * Lấy tất cả package đang active, sort theo priorityScore giảm dần.
 *
 * @returns {Promise<Array>}
 */
export async function getAllActive() {
  return ListingPackage.find({ isActive: true })
    .sort({ priorityScore: -1, createdAt: 1 })
    .lean();
}
