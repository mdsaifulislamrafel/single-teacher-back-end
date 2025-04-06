import express from "express";
import {
  getPayments,
  getPaymentById,
  createPayment,
  updatePaymentStatus,
} from "../controllers/paymentController";
import { authenticate, isAdmin } from "../middleware/auth";

const router = express.Router();

// User routes
router.post("/", authenticate, createPayment);

// Admin routes
router.get("/", authenticate, isAdmin, getPayments);
// router.get("/pending", authenticate, isAdmin, getPendingPayments)
router.get("/:id", authenticate, getPaymentById);
router
  .route("/:id/status")
  .patch(authenticate, isAdmin, updatePaymentStatus)
  .put(authenticate, isAdmin, updatePaymentStatus);

export default router;
