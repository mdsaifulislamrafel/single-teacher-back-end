import type { Request, Response } from "express"
import PDF, { PDFSchema } from "../models/PDF"
import Category from "../models/Category"
import Subcategory from "../models/Subcategory"
import { uploadPDFMiddleware } from "../middleware/pdfUpload"
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

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
export const createPDF = [
  uploadPDFMiddleware,
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "PDF file is required" });
      }

      // Create upload directory if it doesn't exist
      const uploadDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Generate unique filename
      const uniqueFilename = `${uuidv4()}${path.extname(req.file.originalname)}`;
      const uploadPath = path.join(uploadDir, uniqueFilename);

      // Save file to disk
      fs.writeFileSync(uploadPath, req.file.buffer);

      // Generate full accessible URL
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const fileUrl = `${baseUrl}/uploads/${uniqueFilename}`;

      // Prepare PDF data
      const pdfData = {
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        subcategory: req.body.subcategory,
        price: Number(req.body.price),
        fileUrl: fileUrl,
        fileSize: `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`
      };

      // Validate data
      const validatedData = PDFSchema.parse(pdfData);

      // Check category exists
      const category = await Category.findById(validatedData.category);
      if (!category) {
        fs.unlinkSync(uploadPath);
        return res.status(404).json({ error: "Category not found" });
      }

      // Check subcategory exists
      const subcategory = await Subcategory.findById(validatedData.subcategory);
      if (!subcategory) {
        fs.unlinkSync(uploadPath);
        return res.status(404).json({ error: "Subcategory not found" });
      }

      // Create PDF
      const pdf = await PDF.create(validatedData);
      
      res.status(201).json({
        ...pdf.toObject(),
        message: "PDF created successfully",
        downloadUrl: fileUrl
      });

    } catch (error: any) {
      console.error("Error creating PDF:", error);

      // Clean up uploaded file if error occurs
      if (req.file) {
        try {
          const uniqueFilename = `${uuidv4()}${path.extname(req.file.originalname)}`;
          const uploadPath = path.join(__dirname, '../../uploads', uniqueFilename);
          if (fs.existsSync(uploadPath)) {
            fs.unlinkSync(uploadPath);
          }
        } catch (cleanupError) {
          console.error("Error cleaning up file:", cleanupError);
        }
      }

      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors });
      }

      if (error?.errors) {
        return res.status(400).json({ error: error.errors });
      }

      res.status(500).json({ error: "Failed to create PDF" });
    }
  }
];

// Helper function to delete file
const deleteFile = (fileUrl: string) => {
  try {
    const filename = fileUrl.split('/uploads/')[1];
    if (filename) {
      const filePath = path.join(__dirname, '../../uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (err) {
    console.error("Error deleting file:", err);
  }
};

// Update a PDF with file handling
export const updatePDF = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existingPDF = await PDF.findById(id);
    
    if (!existingPDF) {
      return res.status(404).json({ error: "PDF not found" });
    }

    let fileUrl = existingPDF.fileUrl;
    let fileSize = existingPDF.fileSize;

    // Handle file upload if new file is provided
    if (req.file) {
      // Delete old file if exists
      if (existingPDF.fileUrl) {
        deleteFile(existingPDF.fileUrl);
      }

      // Create uploads directory if not exists
      const uploadDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Generate unique filename
      const uniqueFilename = `${uuidv4()}${path.extname(req.file.originalname)}`;
      const uploadPath = path.join(uploadDir, uniqueFilename);
      
      // Save file to disk
      fs.writeFileSync(uploadPath, req.file.buffer);

      // Generate full URL
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      fileUrl = `${baseUrl}/uploads/${uniqueFilename}`;
      fileSize = `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`;
    }

    // Prepare update data
    const updateData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      subcategory: req.body.subcategory,
      price: Number(req.body.price),
      fileUrl,
      fileSize
    };

    // Validate data
    const validatedData = PDFSchema.parse(updateData);

    // Check category exists
    const category = await Category.findById(validatedData.category);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Check subcategory exists
    const subcategory = await Subcategory.findById(validatedData.subcategory);
    if (!subcategory) {
      return res.status(404).json({ error: "Subcategory not found" });
    }

    // Update PDF
    const updatedPDF = await PDF.findByIdAndUpdate(
      id,
      validatedData,
      { new: true, runValidators: true }
    );

    if (!updatedPDF) {
      return res.status(404).json({ error: "PDF not found after update attempt" });
    }

    res.status(200).json({
      ...updatedPDF.toObject(),
      message: "PDF updated successfully"
    });

  } catch (error: any) {
    console.error("Error updating PDF:", error);

    if (error?.errors) {
      return res.status(400).json({ error: error.errors });
    }

    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }

    res.status(500).json({ error: "Failed to update PDF" });
  }
};
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

