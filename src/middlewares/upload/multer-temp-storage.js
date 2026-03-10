import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_TEMP = path.join(process.cwd(), "uploads", "temp");

/**
 * Multer dùng diskStorage để lưu file tạm cho background upload.
 * Files được lưu tại uploads/temp/{jobId}/{filename}
 */
export function createTempStorage() {
  return multer.diskStorage({
    destination: async (req, _file, cb) => {
      const jobId = req.uploadJobId ?? randomUUID();
      req.uploadJobId = jobId;
      const dir = path.join(UPLOAD_TEMP, jobId);
      try {
        await fs.mkdir(dir, { recursive: true });
        cb(null, dir);
      } catch (err) {
        cb(err, null);
      }
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, name);
    }
  });
}

export const uploadTempFormData = () => {
  return multer({
    storage: createTempStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
  });
};
