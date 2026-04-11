/**
 * NotificationGateway — manages Socket.IO rooms for real-time notifications.
 *
 * Architecture:
 * - Each user joins a personal room named `user:{userId}` on connection.
 * - The authenticate middleware attaches the userId to the socket.
 * - When a notification is created, NotificationService calls emitNotification().
 * - This gateway looks up the socket and emits the notification only to that user.
 *
 * This approach is scalable: with Redis adapter (ioredis + socket.io-redis),
 * it works across multiple server instances. Without Redis, it works on a single instance.
 */

import { Server } from "socket.io"
import jwt from "jsonwebtoken"

let io = null

/**
 * Initialize the Socket.IO server. Call this from server.js / app.js
 * after the HTTP server is created.
 *
 * @param {import('http').Server} httpServer
 */
export function initSocketIO(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  // Authenticate socket connections using the access token
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1]

    if (!token) {
      return next(new Error("Authentication error: token missing"))
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      socket.userId = decoded.sub
      next()
    } catch {
      next(new Error("Authentication error: invalid token"))
    }
  })

  io.on("connection", (socket) => {
    const userId = socket.userId

    // Join personal room
    socket.join(`user:${userId}`)

    console.log(`[Socket.IO] User ${userId} connected (socket: ${socket.id})`)

    // Send unread count on connect
    _emitUnreadCount(userId)

    // Handle joining specific rooms (e.g., for admin broadcasts)
    socket.on("join:room", (room) => {
      if (["admin", "staff"].includes(room)) {
        socket.join(`role:${room}`)
      }
    })

    // Handle explicit disconnect
    socket.on("disconnect", (reason) => {
      console.log(`[Socket.IO] User ${userId} disconnected: ${reason}`)
    })
  })

  return io
}

/**
 * Get the io instance (for use in middlewares/services).
 */
export function getIO() {
  if (!io) {
    throw new Error("Socket.IO not initialized. Call initSocketIO() first.")
  }
  return io
}

/**
 * Emit a notification to a specific user.
 * Safe to call from anywhere — if io is not initialized, it silently no-ops.
 *
 * @param {string} userId
 * @param {Object} payload  — notification data
 */
export function emitNotification(userId, payload) {
  if (!io) return
  io.to(`user:${userId}`).emit("notification:new", payload)
}

/**
 * Emit unread count to a specific user.
 */
async function _emitUnreadCount(userId) {
  if (!io) return
  try {
    const Notification = (await import("../models/notification.model.js")).default
    const count = await Notification.getUnreadCount(userId)
    io.to(`user:${userId}`).emit("notification:unread-count", { count })
  } catch {
    // Silently ignore — DB might not be ready
  }
}

/**
 * Emit to all users in a specific role (admin broadcast, etc.).
 */
export function emitToRole(role, event, payload) {
  if (!io) return
  io.to(`role:${role}`).emit(event, payload)
}

/**
 * Emit a system-wide announcement to all connected users.
 */
export function emitSystemAnnouncement(payload) {
  if (!io) return
  io.emit("system:announcement", payload)
}
