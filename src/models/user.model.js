import mongoose from "mongoose"
import bcrypt from "bcrypt"
const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true
    },
    phone: {
      type: String,
      trim: true,
      default: null
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["user", "moderator", "admin"],
      default: "user"
    },
    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active"
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: null
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    isEmailVerify: {
      type: Boolean,
      default: false
    },
    emailVerifyToken: {
      type: String,
      default: null
    },
    emailVerifyTokenExpiry: {
      type: Date,
      default: null
    },
    lastLoginAt: {
      type: Date,
      default: null
    },
    address: {
      trim: true,
      maxlength: 255,
      type: String,
      default: null
    },
    address: {
      provinceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Province",
        default: null
      },
      districtId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "District",
        default: null
        
      },
      wardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ward",
        default: null
      },
    }

  },
  {
    timestamps: true
  }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, status: 1 });

userSchema.pre('save', async function(next) {
  if(!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.passwordHash)
}


export default mongoose.model("User", userSchema);
