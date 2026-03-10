import express from "express";
import { asyncHandler } from "../middlewares/index.js";
import { listPackages } from "../controllers/package.controller.js";

const router = express.Router();

router.get("/", asyncHandler(listPackages));

export default router;
