import Notification from "../models/notification.model.js"
import User from "../models/user.model.js"
import { emitNotification, getIO } from "../gateways/notification.gateway.js"

/**
 * Notification Service — single source of truth for all notifications.
 * Follows the Producer pattern: call `notify()` from any service/controller
 * to create and dispatch a notification across all channels (DB + Socket.IO).
 */

class NotificationService {
  /**
   * Create and dispatch a notification.
   * @param {Object} params
   * @param {mongoose.Types.ObjectId} params.recipientId  - Target user
   * @param {mongoose.Types.ObjectId} [params.senderId]  - Acting user (null = system)
   * @param {string} params.type                         - Notification type enum
   * @param {string} params.title                        - Short title
   * @param {string} params.body                         - Body text
   * @param {Object} [params.data]                       - Extra payload
   * @param {Object} [params.reference]                  - { type, id }
   */
  async notify({ recipientId, senderId = null, type, title, body, data = {}, reference = null }) {
    const recipient = await User.findById(recipientId).lean()
    if (!recipient || recipient.status === "inactive") return

    // Don't notify yourself
    if (senderId && recipientId.toString() === senderId.toString()) return

    // 1. Persist to DB
    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      title,
      body,
      data,
      reference,
    })

    // 2. Emit via Socket.IO (real-time in-app)
    emitNotification(recipientId.toString(), {
      id: notification._id,
      type,
      title,
      body,
      data,
      reference,
      isRead: false,
      createdAt: notification.createdAt,
    })

    return notification
  }

  // ── Convenience helpers for common notification scenarios ──────────────────

  async notifyLikePost({ recipientId, senderId, postId, postTitle }) {
    return this.notify({
      recipientId,
      senderId,
      type: "LIKE_POST",
      title: "New like on your post",
      body: `Someone liked your post${postTitle ? `: "${postTitle.slice(0, 40)}"` : ""}`,
      data: { postId },
      reference: { type: "Post", id: postId },
    })
  }

  async notifyOrderConfirmed({ recipientId, orderId, amount }) {
    return this.notify({
      recipientId,
      senderId: null,
      type: "ORDER_CONFIRMED",
      title: "Payment confirmed",
      body: `Your payment of ${this._formatAmount(amount)} has been confirmed. Your order is being processed.`,
      data: { orderId, amount },
      reference: { type: "Order", id: orderId },
    })
  }

  async notifyOrderFailed({ recipientId, orderId, reason }) {
    return this.notify({
      recipientId,
      senderId: null,
      type: "ORDER_FAILED",
      title: "Payment failed",
      body: reason || "Your payment could not be processed. Please try again.",
      data: { orderId },
      reference: { type: "Order", id: orderId },
    })
  }

  async notifyOrderRefunded({ recipientId, orderId, amount }) {
    return this.notify({
      recipientId,
      senderId: null,
      type: "ORDER_REFUNDED",
      title: "Refund processed",
      body: `A refund of ${this._formatAmount(amount)} has been issued to your account.`,
      data: { orderId, amount },
      reference: { type: "Order", id: orderId },
    })
  }

  async notifyPackageExpiring({ recipientId, packageId, packageName, daysLeft }) {
    return this.notify({
      recipientId,
      senderId: null,
      type: "PACKAGE_EXPIRING",
      title: "Package expiring soon",
      body: `Your "${packageName}" package will expire in ${daysLeft} day${daysLeft === 1 ? "" : "s"}. Renew now to keep your listing active.`,
      data: { packageId, daysLeft },
      reference: { type: "Package", id: packageId },
    })
  }

  async notifyPackageExpired({ recipientId, packageId, packageName }) {
    return this.notify({
      recipientId,
      senderId: null,
      type: "PACKAGE_EXPIRED",
      title: "Package expired",
      body: `Your "${packageName}" package has expired. Your listing may no longer be visible.`,
      data: { packageId },
      reference: { type: "Package", id: packageId },
    })
  }

  async notifyPostApproved({ recipientId, postId, postTitle }) {
    return this.notify({
      recipientId,
      senderId: null,
      type: "POST_APPROVED",
      title: "Post approved",
      body: `Your post${postTitle ? `: "${postTitle.slice(0, 40)}"` : " is now live!"}`,
      data: { postId },
      reference: { type: "Post", id: postId },
    })
  }

  async notifyPostRejected({ recipientId, postId, reason }) {
    return this.notify({
      recipientId,
      senderId: null,
      type: "POST_REJECTED",
      title: "Post rejected",
      body: reason || `Your post has been rejected. Please review our guidelines and try again.`,
      data: { postId },
      reference: { type: "Post", id: postId },
    })
  }

  async notifySystemAnnouncement({ recipientIds, title, body, data = {} }) {
    const notifications = await Notification.insertMany(
      recipientIds.map((rid) => ({
        recipient: rid,
        sender: null,
        type: "SYSTEM_ANNOUNCEMENT",
        title,
        body,
        data,
      }))
    )

    // Emit to all recipients via Socket.IO
    for (const recipientId of recipientIds) {
      const payload = {
        id: notifications.find((n) => n.recipient.toString() === recipientId.toString())?._id,
        type: "SYSTEM_ANNOUNCEMENT",
        title,
        body,
        data,
        isRead: false,
        createdAt: new Date(),
      }
      emitNotification(recipientId.toString(), payload)
    }

    return notifications
  }

  // ── Query helpers ──────────────────────────────────────────────────────────

  async getNotifications(userId, { page = 1, limit = 20, isRead = null } = {}) {
    const filter = { recipient: userId, isDeleted: false }
    if (isRead !== null) filter.isRead = isRead

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("sender", "fullName avatarUrl")
        .lean(),
      Notification.countDocuments(filter),
    ])

    const unreadCount = await Notification.getUnreadCount(userId)

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    }
  }

  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({ _id: notificationId, recipient: userId, isDeleted: false })
    if (!notification) return null
    await notification.markAsRead()

    // Emit updated unread count via Socket.IO
    const count = await Notification.getUnreadCount(userId)
    const io = getIO()
    if (io) io.to(`user:${userId}`).emit("notification:unread-count", { count })

    return notification
  }

  async markAllAsRead(userId) {
    await Notification.markAllAsRead(userId)

    // Emit updated unread count (0) via Socket.IO
    const io = getIO()
    if (io) io.to(`user:${userId}`).emit("notification:unread-count", { count: 0 })

    return { success: true }
  }

  async deleteNotification(notificationId, userId) {
    const result = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isDeleted: true }
    )
    if (!result) return null

    // Emit updated unread count via Socket.IO
    const count = await Notification.getUnreadCount(userId)
    const io = getIO()
    if (io) io.to(`user:${userId}`).emit("notification:unread-count", { count })

    return result
  }

  async deleteAllNotifications(userId) {
    await Notification.updateMany({ recipient: userId }, { isDeleted: true })

    // Emit updated unread count (0) via Socket.IO
    const io = getIO()
    if (io) io.to(`user:${userId}`).emit("notification:unread-count", { count: 0 })

    return { success: true }
  }

  _formatAmount(amount) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)
  }
}

export default new NotificationService()
