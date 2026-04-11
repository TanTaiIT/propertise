import bannerService from "../services/banner.service.js"

/**
 * Banner Cron Job — handles automated scheduling tasks:
 *
 * 1. Auto-expire banners whose endDate has passed
 * 2. Auto-activate banners whose startDate is now
 *
 * Runs every 5 minutes.
 */

let cronInterval = null

export function startBannerCron() {
  if (cronInterval) return

  // Run immediately on start
  _runBannerScheduler()

  // Then run every 5 minutes
  cronInterval = setInterval(_runBannerScheduler, 5 * 60 * 1000)
  console.log("[Banner Cron] Scheduler started (interval: 5min)")
}

export function stopBannerCron() {
  if (cronInterval) {
    clearInterval(cronInterval)
    cronInterval = null
    console.log("[Banner Cron] Scheduler stopped")
  }
}

async function _runBannerScheduler() {
  try {
    // Auto-expire banners whose endDate has passed
    const expiredResult = await bannerService.autoExpire()
    if (expiredResult.modifiedCount > 0) {
      console.log(`[Banner Cron] Auto-expired ${expiredResult.modifiedCount} banner(s)`)
    }

    // Auto-activate banners whose startDate is now
    await _activateScheduledBanners()
  } catch (err) {
    console.error("[Banner Cron] Error running scheduler:", err.message)
  }
}

async function _activateScheduledBanners() {
  const Banner = (await import("../models/banner.model.js")).default
  const now = new Date()

  const result = await Banner.updateMany(
    {
      isDeleted: false,
      isActive: false,
      startDate: { $lte: now },
      $or: [
        { endDate: null },
        { endDate: { $gte: now } },
      ],
    },
    { isActive: true }
  )

  if (result.modifiedCount > 0) {
    console.log(`[Banner Cron] Auto-activated ${result.modifiedCount} scheduled banner(s)`)
  }
}
