import express from "express"
import { getPDFs, getPDFById, createPDF, updatePDF, deletePDF, checkPDFAccess } from "../controllers/pdfController"
import { authenticate, isAdmin } from "../middleware/auth"

const router = express.Router()

// Public routes
router.get("/", getPDFs)
router.get("/:id", getPDFById)

// User routes
router.post("/access", authenticate, checkPDFAccess)

// Admin routes
router.post("/", authenticate, isAdmin, createPDF)
router.put("/:id", authenticate, isAdmin, updatePDF)
router.delete("/:id", authenticate, isAdmin, deletePDF)

export default router

