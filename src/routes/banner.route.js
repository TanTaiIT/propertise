import { Router } from "express"
import {
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
  uploadBannerImage,
  uploadMobileBannerImage,
  getActiveBanners,
  recordBannerClick,
  recordBannerView,
} from "../controllers/banner.controller.js"
import { asyncHandler, authenticate, authorize, validateZod, upload } from "../middlewares/index.js"
import {
  createBannerSchema,
  updateBannerSchema,
  reorderBannerSchema,
  bulkReorderSchema,
} from "../validations/banner.validation.js"

const bannerRouter = Router()

// ── Admin Routes ──────────────────────────────────────────────────────────────
// All admin routes require authentication and admin/staff role
const adminRoutes = () => {
  const router = Router()
  router.use(authenticate)
  router.use(authorize("admin", "staff"))

  // CRUD
  router.post("/", validateZod(createBannerSchema, "body"), asyncHandler(createBanner))
  router.put("/:id", validateZod(updateBannerSchema, "body"), asyncHandler(updateBanner))
  router.delete("/:id", asyncHandler(deleteBanner))
  router.get("/:id", asyncHandler(getBannerById))
  router.get("/", asyncHandler(getAllBanners))

  // Status management
  router.patch("/:id/toggle", asyncHandler(toggleBannerActive))
  router.patch("/:id/priority", validateZod(reorderBannerSchema, "body"), asyncHandler(reorderBanner))
  router.patch("/reorder", validateZod(bulkReorderSchema, "body"), asyncHandler(bulkReorderBanners))

  // Analytics
  router.get("/analytics/overview", asyncHandler(getBannerAnalytics))
  router.get("/analytics/by-position/:position", asyncHandler(getBannersByPosition))

  // Image upload
  router.post("/upload/image", upload.single("image"), asyncHandler(uploadBannerImage))
  router.post("/upload/mobile-image", upload.single("image"), asyncHandler(uploadMobileBannerImage))

  return router
}

// Mount admin routes
bannerRouter.use("/admin", adminRoutes())

// ── Public Routes ─────────────────────────────────────────────────────────────

// Get active banners (filterable by position)
bannerRouter.get("/active", asyncHandler(getActiveBanners))

// Track interactions (these can also be used by authenticated users)
bannerRouter.post("/:id/click", asyncHandler(recordBannerClick))
bannerRouter.post("/:id/view", asyncHandler(recordBannerView))

export default bannerRouter
