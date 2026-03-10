import { getAllActive } from "../services/listing-package.service.js";

/**
 * GET /api/packages - Danh sách package đang active (cho dropdown/selection).
 */
export async function listPackages(_req, res) {
  const packages = await getAllActive();
  return res.json({
    status: "success",
    data: packages
  });
}
