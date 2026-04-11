import notificationService from "../services/notification.service.js"
import { AppError } from "../middlewares/index.js"

async function getNotifications(req, res) {
  const { page = 1, limit = 20, isRead } = req.query

  const parsedIsRead = isRead !== undefined ? isRead === "true" : null

  const result = await notificationService.getNotifications(req.user._id, {
    page: Number(page),
    limit: Math.min(Number(limit), 100),
    isRead: parsedIsRead,
  })

  res.status(200).json({
    status: "success",
    data: result.notifications,
    pagination: result.pagination,
    unreadCount: result.unreadCount,
  })
}

async function markAsRead(req, res) {
  const { id } = req.params

  const notification = await notificationService.markAsRead(id, req.user._id)
  if (!notification) {
    throw AppError.notFound("Notification not found")
  }

  res.status(200).json({
    status: "success",
    message: "Notification marked as read",
  })
}

async function markAllAsRead(req, res) {
  await notificationService.markAllAsRead(req.user._id)

  res.status(200).json({
    status: "success",
    message: "All notifications marked as read",
  })
}

async function deleteNotification(req, res) {
  const { id } = req.params

  const result = await notificationService.deleteNotification(id, req.user._id)
  if (!result) {
    throw AppError.notFound("Notification not found")
  }

  res.status(200).json({
    status: "success",
    message: "Notification deleted",
  })
}

async function deleteAllNotifications(req, res) {
  await notificationService.deleteAllNotifications(req.user._id)

  res.status(200).json({
    status: "success",
    message: "All notifications deleted",
  })
}

export {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
}
