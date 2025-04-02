import mongoose, { Schema, type Document } from "mongoose"

// Mongoose interface
export interface IUserProgress extends Document {
  user: mongoose.Types.ObjectId
  subcategory: mongoose.Types.ObjectId
  completedVideos: mongoose.Types.ObjectId[]
  lastAccessedVideo: mongoose.Types.ObjectId
  lastAccessedAt: Date
  isCompleted: boolean
  createdAt: Date
  updatedAt: Date
}

// Mongoose schema
const userProgressSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subcategory: {
      type: Schema.Types.ObjectId,
      ref: "Subcategory",
      required: true,
    },
    completedVideos: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    lastAccessedVideo: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

// Create a compound index to ensure a user can only have one progress record per subcategory
userProgressSchema.index({ user: 1, subcategory: 1 }, { unique: true })

export default mongoose.model<IUserProgress>("UserProgress", userProgressSchema)

