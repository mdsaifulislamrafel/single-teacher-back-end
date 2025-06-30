import  { Schema, Document, model } from "mongoose";
import { z } from "zod";

// Zod validation schema for creation
export const BookSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  image: z.string().url("Invalid image URL"),
  price: z.number().positive("Price must be a positive number"),
  imagePublicId: z.string().optional(),
});

// Zod validation schema for updates (all fields optional except ID)
export const UpdateBookSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  description: z.string().min(10, "Description must be at least 10 characters").optional(),
  image: z.string().url("Invalid image URL").optional(),
  price: z.number().positive("Price must be a positive number").optional(),
  imagePublicId: z.string().optional(),
}).partial(); // Makes all fields optional

export type BookInput = z.infer<typeof BookSchema>;
export type UpdateBookInput = z.infer<typeof UpdateBookSchema>;

export interface IBook extends Document {
  name: string;
  description: string;
  image: string;
  price: number;
  imagePublicId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      unique: true,
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
    },
    image: {
      type: String,
      required: [true, "Image URL is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price can't be negative"],
    },
    imagePublicId: {
      type: String,
    },
  },
  { 
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      virtuals: true
    }
  }
);

// Add virtual population for category details
bookSchema.virtual('categoryDetails', {
  ref: 'Category',
  localField: 'category',
  foreignField: '_id',
  justOne: true
});

export const Book = model<IBook>("Book", bookSchema);