import cron from "node-cron";
import { processAllPendingUploads } from "../services/upload-media.service.js";

let scheduledTask = null;

/**
 * Bật cron job xử lý upload media (mỗi 5 giây).
 */
export function startUploadMediaCron() {
  const expr = "*/5 * * * * *"; // node-cron supports seconds: every 5 seconds

  if (!cron.validate(expr)) {
    console.warn("[cron] Invalid upload media expression:", expr);
    return;
  }

  scheduledTask = cron.schedule(expr, async () => {
    try {
      const result = await processAllPendingUploads();
      if (result.processed > 0) {
        console.log(`[cron:upload-media] Processed ${result.processed} posts, uploaded ${result.uploaded} images`);
      }
    } catch (err) {
      console.error("[cron:upload-media] Error:", err.message);
    }
  });

  console.log("[cron] Upload media scheduled: every 5 seconds");
}

/**
 * Dừng cron job.
 */
export function stopUploadMediaCron() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
  }
}
