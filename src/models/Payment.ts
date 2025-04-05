import mongoose, { Schema, type Document } from "mongoose";
import { z } from "zod";

// Zod schema for validation
export const PaymentSchema = z.object({
  bankAccountNumber: z.string().optional(),
  courseId: z.string(),
  email: z.string(),
  paymentMethod: z.enum([
    "বিকাশ (bKash)",
    "নগদ (Nagad)",
    "রকেট (Rocket)",
    "ব্যাংক ট্রান্সফার (Bank)",
  ]),
  phoneNumber: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  transactionId: z.string().optional()
});

export type PaymentInput = z.infer<typeof PaymentSchema>;

// Mongoose interface
export interface IPayment extends Document {
  bankAccountNumber: string,
  courseId: mongoose.Types.ObjectId;
  email: string;
  amount: number;
  transactionId: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schema
const paymentSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    item: {
      type: Schema.Types.ObjectId,
      refPath: "itemType",
      required: true,
    },
    itemType: {
      type: String,
      enum: ["course", "pdf"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPayment>("Payment", paymentSchema);
