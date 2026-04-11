import http from "http"
import app from "./app.js"
import { connectDb } from "./config/db.js"
import { startBoostRotationCron } from "./cron/boost-rotation.job.js"
import { startUploadMediaCron } from "./cron/upload-media.job.js"
import { startBannerCron } from "./cron/banner.job.js"
import { initSocketIO } from "./gateways/notification.gateway.js"
import dotenv from "dotenv"

dotenv.config()
const port = process.env.PORT || 5000

async function startServer() {
  try {
    await connectDb()

    // Create HTTP server from Express app (required for Socket.IO)
    const httpServer = http.createServer(app)

    // Initialize Socket.IO on the HTTP server
    initSocketIO(httpServer)

    httpServer.listen(port, () => {
      console.log(`Server is running on port ${port}`)
    })

    startBoostRotationCron()
    startUploadMediaCron()
    startBannerCron()
  } catch (error) {
    console.error("Failed to start server:", error.message)
    process.exit(1)
  }
}

startServer()
