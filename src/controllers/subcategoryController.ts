import type { Request, Response } from "express";
import { ZodError } from "zod";
import mongoose from "mongoose";
import Category from "../models/Category";
import Video from "../models/Video";
import Subcategory, { SubcategorySchema } from "../models/Subcategory";

// Get all subcategories
export const getSubcategories = async (req: Request, res: Response) => {
  try {
    const subcategories = await Subcategory.find()
      .populate("category", "name")
      .sort({ createdAt: -1 });
    res.status(200).json(subcategories);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch subcategories" });
  }
};
// Create a new subcategory
export const createSubcategory = async (req: Request, res: Response) => {
  try {
    const validatedData = SubcategorySchema.parse(req.body);
    
    const category = await Category.findById(validatedData.category);
    if (!category) return res.status(404).json({ error: "Category not found" });

    const existing = await Subcategory.findOne({ 
      name: validatedData.name, 
      category: validatedData.category 
    });
    if (existing) return res.status(409).json({ error: "Subcategory already exists" });

    const subcategory = await Subcategory.create(validatedData);
    
    await Category.findByIdAndUpdate(validatedData.category, {
      $push: { subcategories: subcategory._id }
    });

    res.status(201).json(subcategory);
  } catch (error) {
    res.status(400).json({ error: "Invalid subcategory data" });
  }
};


// Get a single subcategory by ID
export const getSubcategoryById = async (req: Request, res: Response) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id).populate(
      "category",
      "name"
    );

    if (!subcategory) {
      return res.status(404).json({ error: "Subcategory not found" });
    }

    res.status(200).json(subcategory);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch subcategory" });
  }
};

// Get videos for a subcategory
export const getSubcategoryVideos = async (req: Request, res: Response) => {
  try {
    const videos = await Video.find({ 
      subcategory: req.params.id 
    }).sort({ sequence: 1 });
    res.status(200).json(videos);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch videos" });
  }
};


// optional

// Update a subcategory
export const updateSubcategory = async (req: Request, res: Response) => {
  try {
    // Validate input using Zod
    const validatedData = SubcategorySchema.parse(req.body);

    // Check if category exists
    if (validatedData.category) {
      const category = await Category.findById(validatedData.category);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
    }

    // Update subcategory
    const subcategory = await Subcategory.findByIdAndUpdate(
      req.params.id,
      validatedData,
      { new: true, runValidators: true }
    );

    if (!subcategory) {
      return res.status(404).json({ error: "Subcategory not found" });
    }

    res.status(200).json(subcategory);
  } catch (error) {
    console.error("Error updating subcategory:", error);

    // Handle Zod validation error
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.flatten() });
    }

    // Handle Mongoose validation error
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ error: error.errors });
    }

    res.status(500).json({ error: "Failed to update subcategory" });
  }
};

// Delete a subcategory
export const deleteSubcategory = async (req: Request, res: Response) => {
  try {
    // Check if subcategory has videos
    const videos = await Video.find({ subcategory: req.params.id });
    if (videos.length > 0) {
      return res.status(400).json({
        error: "Cannot delete subcategory with videos. Delete videos first.",
      });
    }

    // Delete subcategory
    const subcategory = await Subcategory.findByIdAndDelete(req.params.id);
    if (!subcategory) {
      return res.status(404).json({ error: "Subcategory not found" });
    }

    res.status(200).json({ message: "Subcategory deleted successfully" });
  } catch (error) {
    console.error("Error deleting subcategory:", error);
    res.status(500).json({ error: "Failed to delete subcategory" });
  }
};



export const checkDuplicate = async (req: Request, res: Response) => {
  try {
    const { categoryId, name, excludeId } = req.query;

    const existingSubcategory = await Subcategory.findOne({
      name,
      category: categoryId,
      _id: { $ne: excludeId }, // Exclude current subcategory when checking for update
    });

    res.json({ isDuplicate: !!existingSubcategory });
  } catch (error) {
    res.status(500).json({ error: "Failed to check duplicate subcategory" });
  }
};
