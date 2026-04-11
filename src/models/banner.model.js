import mongoose from "mongoose"

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
    // Main banner image
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    // Optional mobile-specific image (smaller/lighter)
    mobileImageUrl: {
      type: String,
      trim: true,
      default: null,
    },
    // Click-through URL (external link)
    clickUrl: {
      type: String,
      trim: true,
      default: null,
    },
    // Position on page (homepage hero, side banner, popup, etc.)
    position: {
      type: String,
      enum: [
        "HOME_HERO",      // Full-width hero banner on homepage
        "HOME_PROMO",     // Promotional banners below hero
        "SIDEBAR",        // Side bar banners
        "POST_DETAIL",    // Banners shown on post detail page
        "CATEGORY_PAGE",  // Banners on category listing pages
        "POPUP",          // Modal/popup banners
        "ANNOUNCEMENT",   // Top announcement bar
      ],
      default: "HOME_HERO",
      index: true,
    },
    // Display priority within same position (lower = show first)
    priority: {
      type: Number,
      default: 0,
      index: true,
    },
    // Active status — only active banners are shown
    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Scheduling
    startDate: {
      type: Date,
      default: null,
      index: true,
    },
    endDate: {
      type: Date,
      default: null,
      index: true,
    },
    // Targeting
    targetRoles: {
      type: [String],
      enum: ["guest", "user", "staff", "admin"],
      default: ["guest", "user"],
    },
    targetCategories: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
          default: null,
        },
      ],
      default: [],
    },
    // Appearance
    backgroundColor: {
      type: String,
      trim: true,
      default: "#000000",
    },
    textColor: {
      type: String,
      trim: true,
      default: "#ffffff",
    },
    overlayOpacity: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    // Layout
    height: {
      type: String,
      trim: true,
      default: "500px",
    },
    // CTA button text
    ctaText: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },
    // Analytics
    clickCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },
    // Admin metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

// Efficient queries
bannerSchema.index({ isActive: 1, startDate: 1, endDate: 1, position: 1, priority: 1 })
bannerSchema.index({ isDeleted: 1, createdAt: -1 })

/**
 * Check if the banner is currently visible based on schedule and active status.
 */
bannerSchema.virtual("isVisible").get(function () {
  if (!this.isActive) return false
  const now = new Date()
  if (this.startDate && now < this.startDate) return false
  if (this.endDate && now > this.endDate) return false
  return true
})

bannerSchema.set("toJSON", { virtuals: true })
bannerSchema.set("toObject", { virtuals: true })

/**
 * Increment click count atomically.
 */
bannerSchema.statics.incrementClick = async function (bannerId) {
  return this.findByIdAndUpdate(bannerId, { $inc: { clickCount: 1 } })
}

/**
 * Increment view count atomically.
 */
bannerSchema.statics.incrementView = async function (bannerId) {
  return this.findByIdAndUpdate(bannerId, { $inc: { viewCount: 1 } })
}

/**
 * Get all currently visible banners for a specific position.
 * Handles auto-expiry.
 */
bannerSchema.statics.getActiveForPosition = async function (position, { userRole: _userRole, categoryId: _categoryId } = {}) {
  const now = new Date()

  const query = {
    isDeleted: false,
    isActive: true,
    position,
    $or: [
      { startDate: null, endDate: null },
      { startDate: null, endDate: { $gte: now } },
      { startDate: { $lte: now }, endDate: null },
      { startDate: { $lte: now }, endDate: { $gte: now } },
    ],
  }

  return this.find(query)
    .sort({ priority: 1, createdAt: -1 })
    .lean()
}

/**
 * Auto-expire banners whose endDate has passed.
 */
bannerSchema.statics.autoExpire = async function () {
  const result = await this.updateMany(
    { isDeleted: false, isActive: true, endDate: { $lt: new Date() } },
    { isActive: false }
  )
  return result
}

const Banner = mongoose.model("Banner", bannerSchema)

export default Banner
