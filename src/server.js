import app from "./app.js";
import { connectDb } from "./config/db.js";
import { startBoostRotationCron } from "./cron/boost-rotation.job.js";
import { startUploadMediaCron } from "./cron/upload-media.job.js";
import dotenv from 'dotenv';

dotenv.config()
const port = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDb();

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
    startBoostRotationCron();
    startUploadMediaCron();
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
