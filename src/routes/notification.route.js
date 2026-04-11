import { Router } from "express"
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../controllers/notification.controller.js"
import { asyncHandler, authenticate } from "../middlewares/index.js"

const notificationRouter = Router()

// All notification routes require authentication
notificationRouter.use(authenticate)

// GET    /api/notifications           - List all notifications
notificationRouter.get("/", asyncHandler(getNotifications))

// PATCH  /api/notifications/read-all - Mark all as read
notificationRouter.patch("/read-all", asyncHandler(markAllAsRead))

// DELETE /api/notifications           - Delete all notifications
notificationRouter.delete("/", asyncHandler(deleteAllNotifications))

// PATCH  /api/notifications/:id/read - Mark single notification as read
notificationRouter.patch("/:id/read", asyncHandler(markAsRead))

// DELETE /api/notifications/:id      - Delete single notification
notificationRouter.delete("/:id", asyncHandler(deleteNotification))

export default notificationRouter
