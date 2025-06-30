import { string } from "joi";
import mongoose, { Schema, type Document } from "mongoose";
import { z } from "zod";

// Zod Schema for validation
export const PaymentSchema = z.object({
  bankAccountNumber: z.string().optional(),
  itemId: z.string(),
  paymentMethod: z.enum([
    "বিকাশ (bKash)",
    "নগদ (Nagad)",
    "রকেট (Rocket)",
    "ব্যাংক ট্রান্সফার (Bank)",
  ]),
  phoneNumber: z.string().optional(),
  price: z.union([z.number(), z.string()]).transform(Number), // support string or number
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  transactionId: z.string().optional(), // ✅ optional
  user: z.string(),
  itemType: z.enum(["course", "pdf", "book"]),
  shippingInfo: z.object({
    name: z.string().min(3),
    address: z.string().min(10),
    city: z.string().min(2),
    phone: z.string().regex(/^(?:\+88|01)?\d{11}$/, "Invalid Bangladeshi phone number")
  }).optional()
});

export type PaymentInput = z.infer<typeof PaymentSchema>;

// TypeScript Interface
export interface IPayment extends Document {
  bankAccountNumber?: string;
  itemId: mongoose.Types.ObjectId;
  paymentMethod:
    | "বিকাশ (bKash)"
    | "নগদ (Nagad)"
    | "রকেট (Rocket)"
    | "ব্যাংক ট্রান্সফার (Bank)";
  phoneNumber?: string;
  price: number;
  status: "pending" | "approved" | "rejected";
  transactionId?: string;
  user: mongoose.Types.ObjectId;
  itemType: "course" | "pdf" | "book";
  shippingInfo?: {
    name: string;
    address: string;
    city: string;
    phone: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose Schema
const paymentSchema: Schema = new Schema(
  {
    bankAccountNumber: {
      type: String,
    },
    itemId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "itemType",
    },
    paymentMethod: {
      type: String,
      enum: [
        "বিকাশ (bKash)",
        "নগদ (Nagad)",
        "রকেট (Rocket)",
        "ব্যাংক ট্রান্সফার (Bank)",
      ],
      required: true,
    },
    phoneNumber: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    transactionId: {
      type: String,
      required: false, // ✅ optional now
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    itemType: {
      type: String,
      enum: ["course", "pdf", "book"],
      required: true,
    },
   shippingInfo: {
      type: {
        name: String,
        address: String,
        city: String,
        phone: String
      },
      required: false
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPayment>("Payment", paymentSchema);