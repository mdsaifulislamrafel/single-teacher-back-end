import mongoose, { Schema, Document } from "mongoose";
import { z } from "zod";

export const VideoSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  vdoCipherId: z.string().min(1, { message: "VdoCipher ID is required" }),
  duration: z.number().positive(),
  subcategory: z.string().min(1, { message: "Subcategory ID is required" }),
  playbackInfo: z.string().optional(),
});

export type VideoInput = z.infer<typeof VideoSchema>;

export interface IVideo extends Document {
  title: string;
  description?: string;
  vdoCipherId: string;
  duration: number;
  subcategory: mongoose.Types.ObjectId;
  playbackInfo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const videoSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    vdoCipherId: { type: String, required: true },
    duration: { type: Number, required: true, default: 0 },
    subcategory: { type: Schema.Types.ObjectId, ref: "Subcategory", required: true },
    playbackInfo: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IVideo>("Video", videoSchema);