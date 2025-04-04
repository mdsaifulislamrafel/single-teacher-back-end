import express from "express"
import { getPDFs, getPDFById, createPDF, updatePDF, deletePDF } from "../controllers/pdfController"
import { authenticate, isAdmin } from "../middleware/auth"
import { singlePdfUpdate } from "../middleware/singlePdfUpdate"

const router = express.Router()

// Public routes
router.get("/", getPDFs)
router.get("/:id", getPDFById)

// User routes

// Admin routes
router.post("/", authenticate, isAdmin, createPDF)
router.put("/:id", authenticate, isAdmin, singlePdfUpdate, updatePDF);
router.delete("/:id", authenticate, isAdmin, deletePDF)

export default router

