import mongoose from "mongoose"
import bcrypt from "bcrypt"

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "staff", "admin"],
      default: "user",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: null,
    },
    isEmailVerify: {
      type: Boolean,
      default: false,
    },
    emailVerifyToken: {
      type: String,
      default: null,
    },
    emailVerifyTokenExpiry: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    address: {
      provinceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Province",
        default: null,
      },
      districtId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "District",
        default: null,
      },
      wardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ward",
        default: null,
      },
      fullAddress: {
        type: String,
        trim: true,
        maxlength: 255,
        default: null,
      },
    },
    refreshTokens: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

userSchema.index({ email: 1 }, { unique: true })
userSchema.index({ role: 1, status: 1 })

userSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) return next()
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10)
  next()
})

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash)
}

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject()
  delete obj.passwordHash
  delete obj.refreshTokens
  delete obj.emailVerifyToken
  delete obj.emailVerifyTokenExpiry
  return obj
}

export default mongoose.model("User", userSchema)
