import type { Request, Response } from "express"
import PDF, { PDFSchema } from "../models/PDF"
import Category from "../models/Category"
import Subcategory from "../models/Subcategory"
import Payment from "../models/Payment"

// Get all PDFs
export const getPDFs = async (req: Request, res: Response) => {
  try {
    const pdfs = await PDF.find().populate("category", "name").populate("subcategory", "name").sort({ createdAt: -1 })
    res.status(200).json(pdfs)
  } catch (error) {
    console.error("Error fetching PDFs:", error)
    res.status(500).json({ error: "Failed to fetch PDFs" })
  }
}

// Get a single PDF by ID
export const getPDFById = async (req: Request, res: Response) => {
  try {
    const pdf = await PDF.findById(req.params.id).populate("category", "name").populate("subcategory", "name")
    if (!pdf) {
      return res.status(404).json({ error: "PDF not found" })
    }
    res.status(200).json(pdf)
  } catch (error) {
    console.error("Error fetching PDF:", error)
    res.status(500).json({ error: "Failed to fetch PDF" })
  }
}

// Create a new PDF
export const createPDF = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = PDFSchema.parse(req.body)

    // Check if category exists
    const category = await Category.findById(validatedData.category)
    if (!category) {
      return res.status(404).json({ error: "Category not found" })
    }

    // Check if subcategory exists
    const subcategory = await Subcategory.findById(validatedData.subcategory)
    if (!subcategory) {
      return res.status(404).json({ error: "Subcategory not found" })
    }

    // Create PDF
    const pdf = await PDF.create(validatedData)
    res.status(201).json(pdf)
  } catch (error: any) {
    console.error("Error creating PDF:", error)

    if (error?.errors) {
      return res.status(400).json({ error: error.errors })
    }

    res.status(500).json({ error: "Failed to create PDF" })
  }
}

// Update a PDF
export const updatePDF = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = PDFSchema.parse(req.body)

    // Check if category exists
    if (validatedData.category) {
      const category = await Category.findById(validatedData.category)
      if (!category) {
        return res.status(404).json({ error: "Category not found" })
      }
    }

    // Check if subcategory exists
    if (validatedData.subcategory) {
      const subcategory = await Subcategory.findById(validatedData.subcategory)
      if (!subcategory) {
        return res.status(404).json({ error: "Subcategory not found" })
      }
    }

    // Update PDF
    const pdf = await PDF.findByIdAndUpdate(req.params.id, validatedData, { new: true, runValidators: true })

    if (!pdf) {
      return res.status(404).json({ error: "PDF not found" })
    }

    res.status(200).json(pdf)
  } catch (error: any) {
    console.error("Error updating PDF:", error)

    if (error?.errors) {
      return res.status(400).json({ error: error.errors })
    }

    res.status(500).json({ error: "Failed to update PDF" })
  }
}

// Delete a PDF
export const deletePDF = async (req: Request, res: Response) => {
  try {
    // Delete PDF
    const pdf = await PDF.findByIdAndDelete(req.params.id)

    if (!pdf) {
      return res.status(404).json({ error: "PDF not found" })
    }

    res.status(200).json({ message: "PDF deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting PDF:", error)
    res.status(500).json({ error: "Failed to delete PDF" })
  }
}

// Check PDF access for a user
export const checkPDFAccess = async (req: Request, res: Response) => {
  try {
    const { userId, pdfId } = req.body

    if (!userId || !pdfId) {
      return res.status(400).json({
        error: "User ID and PDF ID are required",
      })
    }

    // Get the requested PDF
    const pdf = await PDF.findById(pdfId)
    if (!pdf) {
      return res.status(404).json({ error: "PDF not found" })
    }

    // Check if the user has purchased this PDF
    const payment = await Payment.findOne({
      user: userId,
      item: pdfId,
      itemType: "pdf",
      status: "approved",
    })

    if (!payment) {
      return res.status(403).json({ error: "You have not purchased this PDF" })
    }

    // Generate download URL (in a real implementation, this would be a signed URL)
    const downloadUrl = pdf.fileUrl

    // Update download count
    await PDF.findByIdAndUpdate(pdfId, { $inc: { downloads: 1 } })

    res.status(200).json({
      pdf,
      downloadUrl,
      access: true,
    })
  } catch (error: any) {
    console.error("Error checking PDF access:", error)
    res.status(500).json({ error: "Failed to check PDF access" })
  }
}
