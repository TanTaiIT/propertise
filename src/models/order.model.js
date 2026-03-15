import mongoose from "mongoose";
import { ORDER_STATUS } from "../config/system.js";

const postOrderSchema = new mongoose.Schema(
  {
    orderCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true
    },
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
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      enum: ["VND", "USD"],
      default: "VND"
    },
    orderStatus: {
      type: String,
      enum: [ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.PAID, ORDER_STATUS.FAILED, ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED],
      default: ORDER_STATUS.PENDING_PAYMENT
    },
    paidAt: {
      type: Date,
      default: null
    },
    note: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

postOrderSchema.index({ orderCode: 1 }, { unique: true });
postOrderSchema.index({ userId: 1, createdAt: -1 });
postOrderSchema.index({ postId: 1, orderStatus: 1 });

export default mongoose.model("PostOrder", postOrderSchema);
