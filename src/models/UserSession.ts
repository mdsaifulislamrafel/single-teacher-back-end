import mongoose, { Schema, type Document, type Types } from "mongoose"

export interface IUserSession extends Document {
  userId: Types.ObjectId
  token: string
  deviceInfo: {
    userAgent: string
    ip: string
    browser: string
    os: string
  }
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const userSessionSchema = new Schema<IUserSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    deviceInfo: {
      userAgent: String,
      ip: String,
      browser: String,
      os: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

// Create index for faster queries
userSessionSchema.index({ userId: 1, isActive: 1 })
userSessionSchema.index({ token: 1 })

export default mongoose.model<IUserSession>("UserSession", userSessionSchema)
