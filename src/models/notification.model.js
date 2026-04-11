import mongoose from "mongoose"

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null for system-generated notifications
    },
    type: {
      type: String,
      required: true,
      enum: [
        "LIKE_POST",           // Someone liked your post
        "COMMENT_POST",        // Someone commented on your post
        "FOLLOW_USER",         // Someone followed you
        "ORDER_CONFIRMED",     // Order payment confirmed
        "ORDER_FAILED",        // Order payment failed
        "ORDER_REFUNDED",      // Order refunded
        "PACKAGE_EXPIRING",    // Listing package expiring soon
        "PACKAGE_EXPIRED",     // Listing package expired
        "POST_APPROVED",       // Your post was approved
        "POST_REJECTED",       // Your post was rejected
        "BOOST_ACTIVATED",     // Your post was boosted
        "SYSTEM_ANNOUNCEMENT", // System-wide announcement
        "REPORT_RESOLVED",     // Your report was resolved
        "BADGE_EARNED",        // User earned a badge
      ],
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Reference to the related entity (post, order, user, etc.)
    reference: {
      type: {
        type: String,
        enum: ["Post", "Order", "User", "Package", "Report", null],
        default: null,
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    // Push delivery status for FCM
    pushStatus: {
      type: String,
      enum: ["pending", "sent", "failed", null],
      default: null,
    },
    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// Compound indexes for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 })
notificationSchema.index({ recipient: 1, type: 1, createdAt: -1 })
notificationSchema.index({ recipient: 1, isDeleted: 1, createdAt: -1 })

// Virtual for checking if notification is recent (unread within 7 days)
notificationSchema.virtual("isRecent").get(function () {
  if (this.isRead) return false
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  return this.createdAt > sevenDaysAgo
})

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function (recipientId) {
  return this.updateMany(
    { recipient: recipientId, isRead: false, isDeleted: false },
    { isRead: true, readAt: new Date() }
  )
}

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function (recipientId) {
  return this.countDocuments({
    recipient: recipientId,
    isRead: false,
    isDeleted: false,
  })
}

// Instance method to mark as read
notificationSchema.methods.markAsRead = async function () {
  if (this.isRead) return this
  this.isRead = true
  this.readAt = new Date()
  return this.save()
}

const NOTIFICATION_TYPES = notificationSchema.path("type").enumValues

export { NOTIFICATION_TYPES }

export default mongoose.model("Notification", notificationSchema)
