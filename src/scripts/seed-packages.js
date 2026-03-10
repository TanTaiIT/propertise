#!/usr/bin/env node
/**
 * Seed ListingPackage – chạy một lần hoặc khi cần reset packages.
 * Idempotent: update theo code, không tạo trùng.
 *
 * Usage: node src/scripts/seed-packages.js
 * Hoặc: npm run seed:packages
 */
import "dotenv/config";
import { connectDb } from "../config/db.js";
import ListingPackage from "../models/listing-package.model.js";
import { PACKAGE_CODES, PACKAGE_TYPES } from "../config/package-codes.js";

const PACKAGES = [
  {
    code: PACKAGE_CODES.FREE,
    name: "Tin thường",
    description: "Gói miễn phí - 1 tin, 7 ngày",
    packageType: PACKAGE_TYPES.FREE,
    price: 0,
    currency: "VND",
    durationDays: 7,
    maxPosts: 1,
    priorityScore: 0,
    isActive: true
  },
  {
    code: PACKAGE_CODES.BASIC,
    name: "Gói cơ bản",
    description: "3 tin, 15 ngày",
    packageType: PACKAGE_TYPES.BASIC,
    price: 50000,
    currency: "VND",
    durationDays: 15,
    maxPosts: 3,
    priorityScore: 2,
    isActive: true
  },
  {
    code: PACKAGE_CODES.PREMIUM,
    name: "Premium",
    description: "10 tin, 30 ngày",
    packageType: PACKAGE_TYPES.PREMIUM,
    price: 150000,
    currency: "VND",
    durationDays: 30,
    maxPosts: 10,
    priorityScore: 10,
    isActive: true
  },
  {
    code: PACKAGE_CODES.VIP,
    name: "VIP",
    description: "50 tin, 30 ngày",
    packageType: PACKAGE_TYPES.VIP,
    price: 500000,
    currency: "VND",
    durationDays: 30,
    maxPosts: 50,
    priorityScore: 20,
    isActive: true
  },
  {
    code: PACKAGE_CODES.BOOST3,
    name: "Boost 3 ngày",
    description: "Đẩy tin nổi bật 3 ngày",
    packageType: PACKAGE_TYPES.BOOST,
    price: 30000,
    currency: "VND",
    durationDays: 3,
    maxPosts: 1,
    priorityScore: 50,
    isActive: true
  }
];

async function seedPackages() {
  try {
    await connectDb();

    for (const pkg of PACKAGES) {
      await ListingPackage.findOneAndUpdate(
        { code: pkg.code },
        { $set: pkg },
        { upsert: true, new: true, runValidators: true }
      );
    }

    console.log(`[seed:packages] Done. Synced ${PACKAGES.length} packages.`);
  } catch (err) {
    console.error("[seed:packages] Error:", err.message);
    process.exit(1);
  } finally {
    await import("mongoose").then((m) => m.default.connection.close());
    process.exit(0);
  }
}

seedPackages();
