import mongoose, { Schema, Document } from "mongoose";
import { z } from "zod";

export const VideoSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  url: z.string().url({ message: "Valid URL is required" }),
  duration: z.number().positive(),
  subcategory: z.string().min(1, { message: "Subcategory ID is required" }),
  cloudinaryId: z.string().min(1, { message: "Cloudinary ID is required" }),
});

export type VideoInput = z.infer<typeof VideoSchema>;

export interface IVideo extends Document {
  title: string;
  description?: string;
  url: string;
  duration: number;
  subcategory: mongoose.Types.ObjectId;
  cloudinaryId: string;
  createdAt: Date;
  updatedAt: Date;
}

const videoSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    url: { type: String, required: true },
    duration: { type: Number, required: true },
    subcategory: { type: Schema.Types.ObjectId, ref: "Subcategory", required: true },
    cloudinaryId: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IVideo>("Video", videoSchema);