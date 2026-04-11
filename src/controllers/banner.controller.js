import * as bannerService from "../services/banner.service.js"
import { AppError } from "../middlewares/index.js"

// ── Admin Controllers ─────────────────────────────────────────────────────────

async function createBanner(req, res) {
  const banner = await bannerService.create(req.body, req.user._id)
  res.status(201).json({
    status: "success",
    message: "Banner created successfully",
    data: banner,
  })
}

async function updateBanner(req, res) {
  const { id } = req.params
  const banner = await bannerService.update(id, req.body, req.user._id)
  res.status(200).json({
    status: "success",
    message: "Banner updated successfully",
    data: banner,
  })
}

async function deleteBanner(req, res) {
  const { id } = req.params
  await bannerService.delete(id)
  res.status(200).json({
    status: "success",
    message: "Banner deleted successfully",
  })
}

async function getBannerById(req, res) {
  const { id } = req.params
  const banner = await bannerService.getById(id)
  res.status(200).json({
    status: "success",
    data: banner,
  })
}

async function getAllBanners(req, res) {
  const {
    page = 1,
    limit = 20,
    position,
    isActive,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query

  const result = await bannerService.getAll({
    page: Number(page),
    limit: Math.min(Number(limit), 100),
    position,
    isActive,
    search,
    sortBy,
    sortOrder,
  })

  res.status(200).json({
    status: "success",
    data: result.banners,
    pagination: result.pagination,
  })
}

async function toggleBannerActive(req, res) {
  const { id } = req.params
  const banner = await bannerService.toggleActive(id)
  res.status(200).json({
    status: "success",
    message: `Banner ${banner.isActive ? "activated" : "deactivated"} successfully`,
    data: banner,
  })
}

async function reorderBanner(req, res) {
  const { id } = req.params
  const { priority } = req.body
  const banner = await bannerService.reorder(id, Number(priority))
  res.status(200).json({
    status: "success",
    message: "Banner priority updated",
    data: banner,
  })
}

async function bulkReorderBanners(req, res) {
  const { orderUpdates } = req.body
  if (!Array.isArray(orderUpdates)) {
    throw AppError.badRequest("orderUpdates must be an array of { id, priority }")
  }
  await bannerService.bulkReorder(orderUpdates)
  res.status(200).json({
    status: "success",
    message: "Banner order updated",
  })
}

async function getBannerAnalytics(req, res) {
  const { startDate, endDate } = req.query
  const data = await bannerService.getAnalytics({ startDate, endDate })
  res.status(200).json({
    status: "success",
    data,
  })
}

async function getBannersByPosition(req, res) {
  const { position } = req.params
  const banners = await bannerService.getByPosition(position)
  res.status(200).json({
    status: "success",
    data: banners,
  })
}

// ── Image Upload Controllers ─────────────────────────────────────────────────

async function uploadBannerImage(req, res) {
  if (!req.file) {
    throw AppError.badRequest("No image file provided")
  }
  const result = await bannerService.uploadImage(req.file)
  res.status(200).json({
    status: "success",
    data: result,
  })
}

async function uploadMobileBannerImage(req, res) {
  if (!req.file) {
    throw AppError.badRequest("No image file provided")
  }
  const result = await bannerService.uploadMobileImage(req.file)
  res.status(200).json({
    status: "success",
    data: result,
  })
}

// ── Public Controllers ───────────────────────────────────────────────────────

async function getActiveBanners(req, res) {
  const { position, userRole = "guest", categoryId } = req.query
  const banners = await bannerService.getActiveBanners({ position, userRole, categoryId })
  res.status(200).json({
    status: "success",
    data: banners,
  })
}

async function recordBannerClick(req, res) {
  const { id } = req.params
  await bannerService.recordClick(id)
  res.status(200).json({ status: "success" })
}

async function recordBannerView(req, res) {
  const { id } = req.params
  await bannerService.recordView(id)
  res.status(200).json({ status: "success" })
}

export {
  // Admin
  createBanner,
  updateBanner,
  deleteBanner,
  getBannerById,
  getAllBanners,
  toggleBannerActive,
  reorderBanner,
  bulkReorderBanners,
  getBannerAnalytics,
  getBannersByPosition,
  // Upload
  uploadBannerImage,
  uploadMobileBannerImage,
  // Public
  getActiveBanners,
  recordBannerClick,
  recordBannerView,
}
