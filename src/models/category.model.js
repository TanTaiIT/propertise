import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    displayOrder: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ parentId: 1, isActive: 1 });

export default mongoose.model("Category", categorySchema);
