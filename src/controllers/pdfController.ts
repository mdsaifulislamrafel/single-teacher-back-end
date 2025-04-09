// pdfController.ts
import type { Request, Response } from "express";
import PDF, { PDFSchema } from "../models/PDF";
import Category from "../models/Category";
import Subcategory from "../models/Subcategory";
import cloudinary from "../config/cloudinary";

// Get all PDFs
export const getPDFs = async (req: Request, res: Response) => {
  try {
    const pdfs = await PDF.find()
      .populate("category", "name image")
      .populate("subcategory", "name")
      .sort({ createdAt: -1 });
    res.status(200).json(pdfs);
  } catch (error) {
    console.error("Error fetching PDFs:", error);
    res.status(500).json({ error: "Failed to fetch PDFs" });
  }
};

// Get a single PDF by ID
export const getPDFById = async (req: Request, res: Response): Promise<void> => {
  try {
    const pdf = await PDF.findById(req.params.id)
      .populate('category', 'name')
      .populate('subcategory', 'name');
    if (!pdf) {
      res.status(404).json({ error: 'PDF not found' });
      return;
    }
    res.status(200).json(pdf);
  } catch (error) {
    console.error('Error fetching PDF:', error);
    res.status(500).json({ error: 'Failed to fetch PDF' });
  }
};


const uploadPDFToCloudinary = (buffer: Buffer) => {
  return new Promise<any>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: "pdfs",
        public_id: `pdf_${Date.now()}`,
        format: "pdf",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

// Create a new PDF
export const createPDF = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'PDF file is required' });
      return;
    }

    const result = await uploadPDFToCloudinary(req.file.buffer);

    const pdfData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      subcategory: req.body.subcategory,
      price: Number(req.body.price),
      fileUrl: result.secure_url,
      fileSize: `${(result.bytes / (1024 * 1024)).toFixed(2)} MB`,
      publicId: result.public_id,
    };

    const validatedData = PDFSchema.parse(pdfData);

    const category = await Category.findById(validatedData.category);
    if (!category) {
      await cloudinary.uploader.destroy(result.public_id);
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const subcategory = await Subcategory.findById(validatedData.subcategory);
    if (!subcategory) {
      await cloudinary.uploader.destroy(result.public_id);
      res.status(404).json({ error: 'Subcategory not found' });
      return;
    }

    const pdf = await PDF.create(validatedData);

    res.status(201).json({
      ...pdf.toObject(),
      message: 'PDF created successfully',
      downloadUrl: result.secure_url,
    });
  } catch (error: any) {
    console.error('Error creating PDF:', error);

    if (error.result?.public_id) {
      await cloudinary.uploader.destroy(error.result.public_id).catch(console.error);
    }

    if (error) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }

    if (error.http_code === 400) {
      res.status(400).json({ error: 'Invalid file format. Only PDFs are allowed.' });
      return;
    }

    if (error.http_code === 413) {
      res.status(413).json({ error: 'File too large. Maximum size is 100MB.' });
      return;
    }

    res.status(500).json({ error: 'Failed to create PDF', details: error.message });
  }
};

// Update a PDF
export const updatePDF = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existingPDF = await PDF.findById(id);

    if (!existingPDF) {
      res.status(404).json({ error: 'PDF not found' });
      return;
    }

    let fileUrl = existingPDF.fileUrl;
    let fileSize = existingPDF.fileSize;
    let publicId = existingPDF.publicId;

    if (req.file) {
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }

      const result = await uploadPDFToCloudinary(req.file.buffer);
      fileUrl = result.secure_url;
      fileSize = `${(result.bytes / (1024 * 1024)).toFixed(2)} MB`;
      publicId = result.public_id;
    }

    const updateData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      subcategory: req.body.subcategory,
      price: Number(req.body.price),
      fileUrl,
      fileSize,
      publicId,
    };

    const validatedData = PDFSchema.parse(updateData);

    const category = await Category.findById(validatedData.category);
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const subcategory = await Subcategory.findById(validatedData.subcategory);
    if (!subcategory) {
      res.status(404).json({ error: 'Subcategory not found' });
      return;
    }

    const updatedPDF = await PDF.findByIdAndUpdate(id, validatedData, {
      new: true,
      runValidators: true,
    });

    if (!updatedPDF) {
      res.status(404).json({ error: 'PDF not found after update attempt' });
      return;
    }

    res.status(200).json({
      ...updatedPDF.toObject(),
      message: 'PDF updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating PDF:', error);

    if (error?.errors) {
      res.status(400).json({ error: error.errors });
      return;
    }

    if (error) {
      res.status(400).json({ error: error.errors });
      return;
    }

    res.status(500).json({ error: 'Failed to update PDF' });
  }
};

export const deletePDF = async (req: Request, res: Response): Promise<void> => {
  try {
    const pdf = await PDF.findById(req.params.id);

    if (!pdf) {
      res.status(404).json({ error: 'PDF not found' });
      return;
    }

    if (pdf.publicId) {
      await cloudinary.uploader.destroy(pdf.publicId);
    }

    await PDF.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'PDF deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting PDF:', error);
    res.status(500).json({ error: 'Failed to delete PDF' });
  }
};
