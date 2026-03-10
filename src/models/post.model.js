import mongoose from "mongoose"
import { POST_STATUS } from "../config/system.js"

const mediaSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true
    },
    sortOrder: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
)

const postSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    listingPackageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ListingPackage",
      default: null
    },
    userPackageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserPackage",
      default: null
    },
    type: {
      type: Number,
      default: 0
    },
    propertyType: {
      type: mongoose.Schema.Types.String,
      ref: "Category",
      default: null
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    summary: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    authorPhone: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: [POST_STATUS.DRAFT, POST_STATUS.PENDING, POST_STATUS.PUBLISHED, POST_STATUS.REJECTED, POST_STATUS.ARCHIVED],
      default: POST_STATUS.PENDING
    },
    tags: {
      type: [String],
      default: []
    },
    media: {
      mediaSchema
    },
    pendingMediaJobId: {
      type: String,
      default: null,
      index: true
    },
    publishedAt: {
      type: Date,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    },
    
    isFeatured: {
      type: Boolean,
      default: false
    },
    featuredUntil: {
      type: Date,
      default: null
    },
    priorityScore: {
      type: Number,
      default: 0,
      index: true
    },
    lastBoostedAt: {
      type: Date,
      default: null,
      index: true
    },

    location: {
      province: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Province",
        default: null
      },
      districts: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Districts",
        default: null
      },
      ward: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ward",
        default: null
      },
    },

    address: {
      type: String,
      default: null
    },
    property: {
      area: {
        type: Number,
        min: 0
      },
      price: {
        type: Number,
        min: 0
      },
      currency: {
        type: String,
        enum: ['USD', 'VND', 'SGD']
      },
      width: {
        type: Number,
        min: 0
      },
      length: {
        type: Number,
        min: 0
      },
      bedrooms: {
        type: Number,
        min: 0
      },
      bathrooms: {
        type: Number,
        min: 0
      }
    }
  },
  {
    timestamps: true
  }
);

postSchema.index({ title: "text", content: "text", authorName: "text", tags: "text" });
postSchema.index({ status: 1, lastBoostedAt: -1, priorityScore: -1, createdAt: -1 });
postSchema.index({ authorId: 1, status: 1, createdAt: -1 });
postSchema.index({ categoryId: 1, status: 1, createdAt: -1 });
postSchema.index({ slug: 1 }, { sparse: true });

export default mongoose.model("Post", postSchema);
