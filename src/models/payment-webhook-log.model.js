import mongoose from "mongoose";

const paymentWebhookLogSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ["vnpay", "momo", "stripe", "paypal"],
      required: true
    },
    eventType: {
      type: String,
      required: true,
      trim: true
    },
    eventId: {
      type: String,
      trim: true,
      default: null
    },
    signature: {
      type: String,
      trim: true,
      default: null
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    processed: {
      type: Boolean,
      default: false
    },
    processedAt: {
      type: Date,
      default: null
    },
    errorMessage: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

paymentWebhookLogSchema.index({ provider: 1, eventId: 1 }, { sparse: true });
paymentWebhookLogSchema.index({ processed: 1, createdAt: -1 });

export default mongoose.model("PaymentWebhookLog", paymentWebhookLogSchema);
