import express from "express"
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserCourses,
  getUserPDFs,
  getUserPayments,
} from "../controllers/userController"
import { authenticate, isAdmin } from "../middleware/auth"
import upload from "../middleware/upload"

const router = express.Router()

// Admin routes
router.get("/", authenticate, isAdmin, getUsers)
router.delete("/:id", authenticate, isAdmin, deleteUser)

// User routes
router.get(
  "/:id",
  authenticate,
  (req, res, next) => {
    // Allow users to access their own data
    if (req.user.id === req.params.id || req.user.role === "admin") {
      return next()
    }
    res.status(403).json({ error: "Unauthorized" })
  },
  getUserById,
)

router.put(
  "/:id",
  authenticate,
  (req, res, next) => {
    // Allow users to update their own data
    if (req.user.id === req.params.id || req.user.role === "admin") {
      return next()
    }
    res.status(403).json({ error: "Unauthorized" })
  },
  upload.single("avatar"), // ফিল্ড নাম "avatar" রাখা হয়েছে
  updateUser,
)


router.get(
  "/:id/courses",
  authenticate,
  (req, res, next) => {
    // Allow users to access their own courses
    if (req.user.id === req.params.id || req.user.role === "admin") {
      return next()
    }
    res.status(403).json({ error: "Unauthorized" })
  },
  getUserCourses,
)

router.get(
  "/:id/pdfs",
  authenticate,
  (req, res, next) => {
    // Allow users to access their own PDFs
    if (req.user.id === req.params.id || req.user.role === "admin") {
      return next()
    }
    res.status(403).json({ error: "Unauthorized" })
  },
  getUserPDFs,
)

router.get(
  "/:id/payments",
  authenticate,
  (req, res, next) => {
    // Allow users to access their own payments
    if (req.user.id === req.params.id || req.user.role === "admin") {
      return next()
    }
    res.status(403).json({ error: "Unauthorized" })
  },
  getUserPayments,
)

export default router

