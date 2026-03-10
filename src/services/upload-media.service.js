import fs from "fs/promises";
import path from "path";
import cloudinary from "../config/cloudinary.js";
import sharp from "sharp";
import streamifier from "streamifier";
import Post from "../models/post.model.js";

const UPLOAD_TEMP = path.join(process.cwd(), "uploads", "temp");

async function uploadFileFromPath(filePath) {
  const buffer = await fs.readFile(filePath);
  const compressed = await sharp(buffer)
    .resize(1024, 1024)
    .jpeg({ quality: 80 })
    .toBuffer();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "marketplace/posts" },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(compressed).pipe(stream);
  });
}

/**
 * Xử lý upload media cho post có pendingMediaJobId.
 * Đọc file từ uploads/temp/{jobId}/, upload lên Cloudinary, cập nhật post.
 *
 * @param {object} post - Post document với pendingMediaJobId
 * @returns {Promise<{ uploaded: number }>}
 */
export async function processPendingMediaUpload(post) {
  const jobId = post.pendingMediaJobId;
  if (!jobId) return { uploaded: 0 };

  const tempDir = path.join(UPLOAD_TEMP, jobId);
  let files;
  try {
    files = await fs.readdir(tempDir);
  } catch {
    await Post.findByIdAndUpdate(post._id, { $unset: { pendingMediaJobId: 1 } });
    return { uploaded: 0 };
  }

  const media = [];
  const toDelete = [];

  const validFiles = files
    .filter((f) => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
    .sort();

  for (let i = 0; i < validFiles.length; i++) {
    const filePath = path.join(tempDir, validFiles[i]);
    try {
      const result = await uploadFileFromPath(filePath);
      media.push({ url: result.secure_url, sortOrder: i + 1 });
      toDelete.push(filePath);
    } catch (err) {
      console.error(`[upload-media] Failed ${filePath}:`, err.message);
    }
  }

  await Post.findByIdAndUpdate(post._id, {
    $set: { media },
    $unset: { pendingMediaJobId: 1 }
  });

  for (const p of toDelete) {
    try {
      await fs.unlink(p);
    } catch {
      /* ignore */
    }
  }

  try {
    await fs.rm(tempDir, { recursive: true });
  } catch {
    /* ignore */
  }

  return { uploaded: media.length };
}

/**
 * Xử lý tất cả post có pending upload.
 */
export async function processAllPendingUploads() {
  const posts = await Post.find({
    pendingMediaJobId: { $exists: true, $ne: null }
  })
    .select("_id pendingMediaJobId")
    .lean();

  let total = 0;
  for (const post of posts) {
    try {
      const result = await processPendingMediaUpload(post);
      total += result.uploaded;
    } catch (err) {
      console.error(`[upload-media] Post ${post._id}:`, err.message);
    }
  }
  return { processed: posts.length, uploaded: total };
}
