import Banner from "../models/banner.model.js"
import cloudinary from "../config/cloudinary.js"
import { AppError } from "../middlewares/index.js"

class BannerService {
  /**
   * Create a new banner.
   */
  async create(data, createdBy) {
    const banner = await Banner.create({
      ...data,
      createdBy,
    })
    return banner
  }

  /**
   * Update a banner. If a new image is uploaded, replace the old one.
   */
  async update(bannerId, data, updatedBy) {
    const banner = await Banner.findById(bannerId)
    if (!banner) {
      throw AppError.notFound("Banner not found")
    }

    // If replacing the image, delete the old one from Cloudinary
    if (data.imageUrl && data.imageUrl !== banner.imageUrl) {
      await this._deleteImage(banner.imageUrl)
    }
    if (data.mobileImageUrl && data.mobileImageUrl !== banner.mobileImageUrl) {
      await this._deleteImage(banner.mobileImageUrl)
    }

    Object.assign(banner, { ...data, updatedBy })
    await banner.save()
    return banner
  }

  /**
   * Soft delete a banner.
   */
  async delete(bannerId) {
    const banner = await Banner.findByIdAndUpdate(
      bannerId,
      { isDeleted: true },
      { new: true }
    )
    if (!banner) {
      throw AppError.notFound("Banner not found")
    }
    return banner
  }

  /**
   * Get a single banner by ID (admin view).
   */
  async getById(bannerId) {
    const banner = await Banner.findById(bannerId).populate("createdBy", "fullName").lean()
    if (!banner) {
      throw AppError.notFound("Banner not found")
    }
    return banner
  }

  /**
   * Get all banners with pagination and filters (admin view).
   */
  async getAll({ page = 1, limit = 20, position, isActive, search, sortBy = "createdAt", sortOrder = "desc" } = {}) {
    const filter = { isDeleted: false }

    if (position) filter.position = position
    if (isActive !== undefined) filter.isActive = isActive === "true"
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ]
    }

    const sortDirection = sortOrder === "asc" ? 1 : -1
    const sort = { [sortBy]: sortDirection }

    const [banners, total] = await Promise.all([
      Banner.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("createdBy", "fullName")
        .lean(),
      Banner.countDocuments(filter),
    ])

    return {
      banners,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Get all currently visible banners for the public API.
   * Returns banners by position, filtered by schedule and targeting.
   */
  async getActiveBanners({ position, userRole = "guest", categoryId = null } = {}) {
    const now = new Date()

    const filter = {
      isDeleted: false,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }

    if (position) {
      filter.position = position
    }

    const banners = await Banner.find(filter)
      .sort({ priority: 1, createdAt: -1 })
      .lean()

    // Client-side targeting filter
    return banners.filter((banner) => {
      if (!banner.targetRoles.includes(userRole)) return false
      if (categoryId && banner.targetCategories.length > 0) {
        if (!banner.targetCategories.some((c) => c.toString() === categoryId)) return false
      }
      return true
    })
  }

  /**
   * Get banners for a specific position (admin preview).
   */
  async getByPosition(position) {
    return Banner.find({ isDeleted: false, position })
      .sort({ priority: 1, createdAt: -1 })
      .populate("createdBy", "fullName")
      .lean()
  }

  /**
   * Toggle active status.
   */
  async toggleActive(bannerId) {
    const banner = await Banner.findById(bannerId)
    if (!banner) {
      throw AppError.notFound("Banner not found")
    }
    banner.isActive = !banner.isActive
    await banner.save()
    return banner
  }

  /**
   * Reorder banners within a position (set priority).
   */
  async reorder(bannerId, newPriority) {
    const banner = await Banner.findByIdAndUpdate(
      bannerId,
      { priority: newPriority },
      { new: true }
    )
    if (!banner) {
      throw AppError.notFound("Banner not found")
    }
    return banner
  }

  /**
   * Bulk reorder banners.
   * @param {Array<{ id: string, priority: number }>} orderUpdates
   */
  async bulkReorder(orderUpdates) {
    const session = await Banner.startSession()
    session.startTransaction()
    try {
      for (const { id, priority } of orderUpdates) {
        await Banner.findByIdAndUpdate(id, { priority }, { session })
      }
      await session.commitTransaction()
      session.endSession()
    } catch (err) {
      await session.abortTransaction()
      session.endSession()
      throw err
    }
  }

  /**
   * Upload a banner image to Cloudinary and return the URL.
   */
  async uploadImage(file) {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "banners",
      resource_type: "image",
      transformation: [{ width: 1920, height: 800, crop: "fill", gravity: "center" }],
    })
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    }
  }

  /**
   * Upload a mobile banner image to Cloudinary.
   */
  async uploadMobileImage(file) {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "banners/mobile",
      resource_type: "image",
      transformation: [{ width: 750, height: 400, crop: "fill", gravity: "center" }],
    })
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    }
  }

  /**
   * Record a click on a banner.
   */
  async recordClick(bannerId) {
    return Banner.incrementClick(bannerId)
  }

  /**
   * Record a view on a banner.
   */
  async recordView(bannerId) {
    return Banner.incrementView(bannerId)
  }

  /**
   * Get banner analytics summary.
   */
  async getAnalytics({ startDate, endDate } = {}) {
    const filter = { isDeleted: false }
    if (startDate) filter.createdAt = { $gte: new Date(startDate) }
    if (endDate) {
      filter.createdAt = { ...(filter.createdAt || {}), $lte: new Date(endDate) }
    }

    const [banners, total] = await Promise.all([
      Banner.find(filter)
        .sort({ viewCount: -1 })
        .select("title position viewCount clickCount priority isActive startDate endDate")
        .lean(),
      Banner.countDocuments(filter),
    ])

    const totals = banners.reduce(
      (acc, b) => {
        acc.totalViews += b.viewCount
        acc.totalClicks += b.clickCount
        return acc
      },
      { totalViews: 0, totalClicks: 0 }
    )

    return {
      banners,
      summary: {
        ...totals,
        ctr: totals.totalViews > 0 ? ((totals.totalClicks / totals.totalViews) * 100).toFixed(2) : "0.00",
        totalBanners: total,
      },
    }
  }

  /**
   * Auto-expire banners whose endDate has passed.
   */
  async autoExpire() {
    return Banner.autoExpire()
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Delete an image from Cloudinary by URL.
   * Extracts public_id from the Cloudinary URL.
   */
  async _deleteImage(imageUrl) {
    if (!imageUrl || !imageUrl.includes("cloudinary.com")) return
    try {
      // Extract public_id from URL: .../banners/imageName.jpg
      const urlParts = imageUrl.split("/")
      const uploadIndex = urlParts.findIndex((p) => p === "upload")
      if (uploadIndex === -1) return
      const publicId = urlParts.slice(uploadIndex + 1).join("/").split(".")[0]
      await cloudinary.uploader.destroy(publicId)
    } catch {
      // Log but don't throw — image cleanup shouldn't fail the operation
    }
  }
}

export default new BannerService()
