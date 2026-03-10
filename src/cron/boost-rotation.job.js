import cron from "node-cron";
import { rotateBoostedListings } from "../services/boost-rotation.service.js";
import { BOOST_ROTATION } from "../config/system.js";

let scheduledTask = null;

/**
 * Bật cron job xoay vòng boost.
 * Gọi khi server start (sau khi connect DB).
 */
export function startBoostRotationCron() {
  const expr = BOOST_ROTATION.cronExpression ?? "0 */4 * * *";

  if (!cron.validate(expr)) {
    console.warn("[cron] Invalid boost rotation expression:", expr);
    return;
  }

  scheduledTask = cron.schedule(expr, async () => {
    try {
      const result = await rotateBoostedListings();
      if (result.rotated > 0) {
        console.log(
          `[cron:boost] Rotated ${result.rotated} listings`,
          result.byTier
        );
      }
    } catch (err) {
      console.error("[cron:boost] Error:", err.message);
    }
  });

  console.log(`[cron] Boost rotation scheduled: ${expr}`);
}

/**
 * Dừng cron job (cho graceful shutdown).
 */
export function stopBoostRotationCron() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log("[cron] Boost rotation stopped.");
  }
}
