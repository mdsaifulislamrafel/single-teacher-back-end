import mongoose, { Schema, Document, model } from "mongoose";

export interface ISupport extends Document {
  user: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  isActive: boolean;
  meetingLink: string;
  supportStartTime: string;
  supportEndTime: string;
  createdAt: Date;
  updatedAt: Date;
}

const supportSchema: Schema = new Schema(
  {
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
      required: [true, "Active status is required"],
    },
    meetingLink: {
      type: String,
      required: [true, "Meeting link is required"],
    },
    supportStartTime: {
      type: String,
      required: [true, "Support start time is required"],
    },
    supportEndTime: {
      type: String,
      required: [true, "Support end time is required"],
    },
  },
  {
    timestamps: true,
  }
);

export const Support = model<ISupport>("Support", supportSchema);