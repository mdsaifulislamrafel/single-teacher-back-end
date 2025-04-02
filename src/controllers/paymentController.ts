import type { Request, Response } from "express";
import Payment, { PaymentSchema } from "../models/Payment";
import User from "../models/User";
import UserProgress from "../models/UserProgress";

// Get all payments
export const getPayments = async (req: Request, res: Response) => {
  try {
    const payments = await Payment.find()
      .populate("user", "name email")
      .populate({
        path: "item",
        select: "title",
      })
      .sort({ createdAt: -1 });

    res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};

// Get a single payment by ID
export const getPaymentById = async (req: Request, res: Response) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("user", "name email")
      .populate({
        path: "item",
        select: "title",
      });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.status(200).json(payment);
  } catch (error) {
    console.error("Error fetching payment:", error);
    res.status(500).json({ error: "Failed to fetch payment" });
  }
};

// Create a new payment
export const createPayment = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = PaymentSchema.parse(req.body);

    // Check if user exists
    const user = await User.findById(validatedData.user);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create payment
    const payment = await Payment.create(validatedData);

    res.status(201).json(payment);
  } catch (error) {
    console.error("Error creating payment:", error);

    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: "Failed to create payment" });
  }
};

// Update payment status
export const updatePaymentStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    if (!status || !["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Valid status is required" });
    }

    // Get payment
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // Update status
    payment.status = status;
    await payment.save();

    // If payment is approved and it's for a course (subcategory)
    if (status === "approved" && payment.itemType === "course") {
      // Create user progress for the subcategory
      await UserProgress.findOneAndUpdate(
        {
          user: payment.user,
          subcategory: payment.item,
        },
        {
          user: payment.user,
          subcategory: payment.item,
          completedVideos: [],
          isCompleted: false,
        },
        { upsert: true, new: true }
      );
    }

    res.status(200).json(payment);
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ error: "Failed to update payment status" });
  }
};

// Get pending payments
export const getPendingPayments = async (req: Request, res: Response) => {
  try {
    const payments = await Payment.find({ status: "pending" })
      .populate("user", "name email")
      .populate({
        path: "item",
        select: "title",
      })
      .sort({ createdAt: -1 });

    res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching pending payments:", error);
    res.status(500).json({ error: "Failed to fetch pending payments" });
  }
};
