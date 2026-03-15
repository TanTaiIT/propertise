import mongoose from "mongoose"

export const userPackageSchema = new mongoose.Schema(
    {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        listingPackageId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ListingPackage",
          required: true
        },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        status: {
          type: String,
          enum: ["active", "inactive", "expired"],
          default: "active"
        },
    
        // ---- các field mới ----
        remainingPosts: { // số bài đăng còn lại
          type: Number,
          default: 0,
          min: 0
        },
        priorityScore: { // điểm ưu tiên cộng dồn
          type: Number,
          default: 0
        }
      },
      { timestamps: true }
)

export default mongoose.model("UserPackage", userPackageSchema);