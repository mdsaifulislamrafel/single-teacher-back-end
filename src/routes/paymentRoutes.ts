import express from "express"
import {
  getPayments,
  getPaymentById,
  createPayment,
  updatePaymentStatus,
  getPendingPayments,
} from "../controllers/paymentController"
import { authenticate, isAdmin } from "../middleware/auth"

const router = express.Router()

// User routes
router.post("/", authenticate, createPayment)

// Admin routes
router.get("/", authenticate, isAdmin, getPayments)
router.get("/pending", authenticate, isAdmin, getPendingPayments)
router.get("/:id", authenticate, isAdmin, getPaymentById)
router.patch("/:id/status", authenticate, isAdmin, updatePaymentStatus)

export default router

