import mongoose, { Schema, type Document } from "mongoose"
import { z } from "zod"

// Zod schema for validation
export const PaymentSchema = z.object({
  user: z.string().min(1, { message: "User ID is required" }),
  item: z.string().min(1, { message: "Item ID is required" }),
  itemType: z.enum(["course", "pdf"]),
  amount: z.number().positive({ message: "Amount must be positive" }),
  transactionId: z.string().min(1, { message: "Transaction ID is required" }),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
})

export type PaymentInput = z.infer<typeof PaymentSchema>

// Mongoose interface
export interface IPayment extends Document {
  user: mongoose.Types.ObjectId
  item: mongoose.Types.ObjectId
  itemType: "course" | "pdf"
  amount: number
  transactionId: string
  status: "pending" | "approved" | "rejected"
  createdAt: Date
  updatedAt: Date
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
  },
)

export default mongoose.model<IPayment>("Payment", paymentSchema)

