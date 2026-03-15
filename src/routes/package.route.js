import express from "express";
import { asyncHandler, authenticate } from "../middlewares/index.js";
import { listPackages } from "../controllers/package.controller.js";

const router = express.Router();

router.get("/", authenticate, asyncHandler(listPackages));

export default router;
