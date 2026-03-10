import mongoose from "mongoose";

const listingPackageSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    packageType: {
      type: String,
      enum: ["free", "basic", "standard", "premium", "vip", "boost"],
      default: "standard"
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      enum: ["VND", "USD"],
      default: "VND"
    },
    durationDays: {
      type: Number,
      required: true,
      min: 1
    },
    maxPosts: {
      type: Number,
      default: 1,
      min: 1
    },
    priorityScore: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

listingPackageSchema.index({ isActive: 1, packageType: 1 });
listingPackageSchema.index({ packageType: 1, priorityScore: -1 });

export default mongoose.model("ListingPackage", listingPackageSchema);
