import mongoose, { Schema, Document } from "mongoose";
import { z } from "zod";

export const SubcategorySchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  category: z.string().min(1, { message: "Category ID is required" })
});

export type SubcategoryInput = z.infer<typeof SubcategorySchema>;

export interface ISubcategory extends Document {
  name: string;
  description: string;
  category: mongoose.Types.ObjectId;
  videos: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const subcategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    videos: [{ type: Schema.Types.ObjectId, ref: "Video" }]
  },
  { timestamps: true }
);

subcategorySchema.index({ name: 1, category: 1 }, { unique: true });

export default mongoose.model<ISubcategory>("Subcategory", subcategorySchema);