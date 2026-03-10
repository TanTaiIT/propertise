import { uploadMediaQueue } from "../config/queue.js";
import { startUploadMediaWorker } from "./upload-media.job.js";

/**
 * Thêm job upload media cho post.
 *
 * @param {string} postId - Post _id
 * @param {string[]} filePaths - Đường dẫn tuyệt đối tới các file tạm
 */
export async function queueUploadPostMedia(postId, filePaths) {
  if (!filePaths?.length) return null;

  const job = await uploadMediaQueue.add("upload", { postId, filePaths });
  return job;
}

/**
 * Khởi động các workers (gọi khi server start).
 */
export function startWorkers() {
  startUploadMediaWorker();
}
