import mongoose, { Schema, Document } from "mongoose";
import { z } from "zod";

export const CategorySchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  image: z.string().url().optional()
});

export type CategoryInput = z.infer<typeof CategorySchema>;

export interface ICategory extends Document {
  name: string;
  description: string;
  image?: string;
  subcategories: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    image: { type: String },
    subcategories: [{ type: Schema.Types.ObjectId, ref: "Subcategory" }]
  },
  { timestamps: true }
);

export default mongoose.model<ICategory>("Category", categorySchema);