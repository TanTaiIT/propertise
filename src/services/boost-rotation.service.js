import Post from "../models/post.model.js";
import { POST_STATUS } from "../config/system.js";
import { BOOST_ROTATION } from "../config/system.js";

/**
 * Tin được boost: published, có priorityScore > 0, còn trong thời hạn featured.
 */
function getBoostEligibleQuery() {
  const now = new Date();
  return {
    status: POST_STATUS.PUBLISHED,
    priorityScore: { $gt: 0 },
    $or: [{ featuredUntil: { $gt: now } }, { featuredUntil: null }],
    expiresAt: { $gt: now }
  };
}

/**
 * Xoay vòng boost – đẩy batch tin lên đầu (như Chợ Tốt, Batdongsan).
 * Chạy theo chu kỳ (cron): lấy các tin đã lâu không được boost, set lastBoostedAt = now.
 *
 * @returns {Promise<{ rotated: number; byTier: Record<number, number> }>}
 */
export async function rotateBoostedListings() {
  const query = getBoostEligibleQuery();
  const batchSize = BOOST_ROTATION.batchSizePerTier ?? 20;

  const allEligible = await Post.find(query)
    .select("_id priorityScore lastBoostedAt")
    .sort({ priorityScore: -1, lastBoostedAt: 1, createdAt: 1 }) // Tier desc, oldest boost first
    .lean();

  const byTier = {};
  const idsToUpdate = [];

  for (const post of allEligible) {
    const tier = post.priorityScore;
    if (!byTier[tier]) byTier[tier] = 0;
    if (byTier[tier] >= batchSize) continue;
    idsToUpdate.push(post._id);
    byTier[tier]++;
  }

  if (idsToUpdate.length === 0) {
    return { rotated: 0, byTier };
  }

  const now = new Date();
  await Post.updateMany(
    { _id: { $in: idsToUpdate } },
    { $set: { lastBoostedAt: now } }
  );

  return {
    rotated: idsToUpdate.length,
    byTier
  };
}
