import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    paymentCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PostOrder",
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
    provider: {
      type: String,
      enum: ["vnpay", "momo", "stripe", "paypal", "manual"],
      required: true
    },
    method: {
      type: String,
      enum: ["bank_transfer", "card", "wallet", "qr", "other"],
      default: "other"
    },
    transactionId: {
      type: String,
      trim: true,
      default: null
    },
    providerPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    paymentStatus: {
      type: String,
      enum: ["initiated", "pending", "succeeded", "failed", "cancelled", "refunded"],
      default: "initiated"
    },
    paidAt: {
      type: Date,
      default: null
    },
    failureReason: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

paymentSchema.index({ paymentCode: 1 }, { unique: true });
paymentSchema.index({ orderId: 1, paymentStatus: 1 });
paymentSchema.index({ transactionId: 1 }, { sparse: true });
paymentSchema.index({ provider: 1, createdAt: -1 });

export default mongoose.model("Payment", paymentSchema);
