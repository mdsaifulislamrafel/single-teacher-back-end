import mongoose, { Schema, Document } from "mongoose";
import { z } from "zod";

// Zod validation schema
export const CategorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  image: z.string().url("Invalid image URL"),
  imagePublicId: z.string().optional() // Added for Cloudinary public_id
});

// Type derived from Zod schema
export type CategoryInput = z.infer<typeof CategorySchema>;

// Mongoose document interface
export interface ICategory extends Document {
  name: string;
  description: string;
  image: string;
  imagePublicId?: string; // Added for Cloudinary public_id
  subcategories: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schema
const categorySchema: Schema = new Schema(
  {
    name: { 
      type: String, 
      required: [true, "Name is required"], 
      unique: true,
      trim: true
    },
    description: { 
      type: String, 
      required: [true, "Description is required"],
      trim: true
    },
    image: { 
      type: String, 
      required: [true, "Image URL is required"],
      validate: {
        validator: (value: string) => {
          try {
            new URL(value);
            return true;
          } catch {
            return false;
          }
        },
        message: "Invalid image URL"
      }
    },
    imagePublicId: { 
      type: String, 
      select: false // Don't return this field by default
    },
    subcategories: [{ 
      type: Schema.Types.ObjectId, 
      ref: "Subcategory" 
    }]
  },
  { 
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        delete ret.imagePublicId;
        return ret;
      }
    },
    toObject: {
      virtuals: true
    }
  }
);

// Index for better search performance
categorySchema.index({ name: 1 });

// Create and export the model
export default mongoose.model<ICategory>("Category", categorySchema);