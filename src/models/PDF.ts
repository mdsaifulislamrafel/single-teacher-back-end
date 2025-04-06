import mongoose, { Schema, type Document } from "mongoose";
import { z } from "zod";

// Zod schema for validation
export const PDFSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters" }),
  category: z.string().min(1, { message: "Category ID is required" }),
  subcategory: z.string().min(1, { message: "Subcategory ID is required" }),
  price: z.number().nonnegative({ message: "Price must be 0 or more" }),
  fileUrl: z.string().url({ message: "Valid file URL is required" }),
  fileSize: z.string().optional(),
  publicId: z.string().optional(),
});

export type PDFInput = z.infer<typeof PDFSchema>;

// Mongoose interface
export interface IPDF extends Document {
  title: string;
  description: string;
  category: mongoose.Types.ObjectId;
  subcategory: mongoose.Types.ObjectId;
  price: number;
  fileUrl: string;
  fileSize: string;
  publicId?: string;
  downloads: number;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schema
const pdfSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subcategory: {
      type: Schema.Types.ObjectId,
      ref: "Subcategory",
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileSize: {
      type: String,
      default: "0 MB",
    },
    publicId: {
      type: String,
    },
    downloads: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPDF>("Pdf", pdfSchema);
