import type { Request, Response } from "express";
import Payment, { PaymentSchema } from "../models/Payment";
import User from "../models/User";
import { z } from "zod";


// Create Payment
export const createPayment = async (req: Request, res: Response): Promise<void> => {
  try {

    // Validate input
    const validatedData = PaymentSchema.parse(req.body);

    // Check if payment already exists for the same itemId and user
    const isExistData = await Payment.findOne({
      itemId: validatedData.itemId,
      user: validatedData.user,
    });

    if (isExistData) {
      res.status(409).json({
        error: "You have already submitted a payment for this item.",
      });
      return;
    }

    // Check if user exists
    const user = await User.findById(validatedData.user);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Create payment
    const payment = await Payment.create(validatedData);

    res.status(201).json(payment);
  } catch (error) {
    console.error("Error creating payment:", error);

    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: "Failed to create payment" });
  }
};

// Get Payments
export const getPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const payments = await Payment.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    if (!payments || payments.length === 0) {
      res.status(404).json({ error: "Payments not found" });
      return;
    }

    const populatedPayments = await Promise.all(
      payments.map(async (payment) => {
        if (payment.itemType === "course") {
          const populatedCourse = await Payment.populate(payment, {
            path: "itemId",
            model: "Category",
            populate: {
              path: "subcategories",
              model: "Subcategory",
              populate: {
                path: "videos",
                model: "Video",
              },
            },
          });
          return populatedCourse;
        } else if (payment.itemType === "pdf") {
          const populatedPdf = await Payment.populate(payment, {
            path: "itemId",
            model: "Pdf",
          });
          return populatedPdf;
        } else {
          return payment;
        }
      })
    );

    res.status(200).json(populatedPayments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};

// Get Payment by ID
export const getPaymentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const payments = await Payment.find({ user: req.params.id })
      .populate("user", "name email");

    if (!payments || payments.length === 0) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }

    const populatedPayments = await Promise.all(
      payments.map(async (payment) => {
        if (payment.itemType === "course") {
          const populatedCourse = await Payment.populate(payment, {
            path: "itemId",
            model: "Category",
            populate: {
              path: "subcategories",
              model: "Subcategory",
              populate: {
                path: "videos",
                model: "Video",
              },
            },
          });
          return populatedCourse;
        } else if (payment.itemType === "pdf") {
          const populatedPdf = await Payment.populate(payment, {
            path: "itemId",
            model: "Pdf",
          });
          return populatedPdf;
        } else {
          return payment;
        }
      })
    );

    res.status(200).json(populatedPayments);
  } catch (error) {
    console.error("Error fetching payment by ID:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


// controllers/paymentController.ts


// Optional: Validate incoming body with Zod
const updatePaymentStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
});


// Update Payment Status
export const updatePaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate request body using Zod
    const parseResult = updatePaymentStatusSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        error: "Invalid status. Must be one of: pending, approved, or rejected",
        issues: parseResult.error.issues,
      });
      return;
    }

    const { status } = parseResult.data;

    // Find the payment by ID
    const payment = await Payment.findById(id);

    if (!payment) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }

    // Update the status
    payment.status = status;
    await payment.save();

    res.status(200).json({
      message: "Payment status updated successfully",
      data: payment,
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ error: "Failed to update payment status" });
  }
};


// Update payment status

// ✅ Update Payment Status Controller