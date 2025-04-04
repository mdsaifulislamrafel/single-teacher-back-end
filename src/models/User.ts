import mongoose, { Schema, type Document } from "mongoose"
import bcrypt from "bcryptjs"
import { z } from "zod"

// Zod schema for validation
export const UserSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  role: z.enum(["user", "admin"]).default("user"),
})

export type UserInput = z.infer<typeof UserSchema>

// Mongoose interface
export interface IUser extends Document {
  name: string
  email: string
  password: string
  role: "user" | "admin"
  googleId?: string
  avatar?: {
    public_id: string;
    url: string;
  };
  createdAt: Date
  updatedAt: Date
  comparePassword(candidatePassword: string): Promise<boolean>
}

// Mongoose schema
export const userSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    googleId: {
      type: String,
    },
    avatar: {
      public_id: String,
      url: String,
    },
  },
  {
    timestamps: true,
  },
)

// Hash password before saving
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error: any) {
    next(error)
  }
})

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password)
}

export default mongoose.model<IUser>("User", userSchema)

