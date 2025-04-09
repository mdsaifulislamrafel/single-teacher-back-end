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
    console.error("Error fetching subcategories:", error);
    res.status(500).json({ error: "Failed to fetch subcategories" });
  }
};
// Create a new subcategory
export const createSubcategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validatedData = SubcategorySchema.parse(req.body);

    const category = await Category.findById(validatedData.category);
    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return; // Prevent further code execution
    }

    const existing = await Subcategory.findOne({
      name: validatedData.name,
      category: validatedData.category,
    });
    if (existing) {
      res.status(409).json({ error: "Subcategory already exists" });
      return; // Prevent further code execution
    }

    const subcategory = await Subcategory.create(validatedData);

    await Category.findByIdAndUpdate(validatedData.category, {
      $push: { subcategories: subcategory._id },
    });

    res.status(201).json(subcategory); // Send the response, don't return it
  } catch (error) {
    res.status(400).json({ error: "Invalid subcategory data" });
  }
};

// Get a single subcategory by ID
export const getSubcategoryById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const subcategory = await Subcategory.findById(req.params.id).populate(
      "category",
      "name"
    );

    if (!subcategory) {
      res.status(404).json({ error: "Subcategory not found" });
      return; // Prevent further code execution
    }

    res.status(200).json(subcategory); // Send the response, don't return it
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch subcategory" });
  }
};
// Get videos for a subcategory
export const getSubcategoryVideos = async (req: Request, res: Response) => {
  try {
    const videos = await Video.find({
      subcategory: req.params.id,
    }).sort({ sequence: 1 });
    res.status(200).json(videos);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch videos" });
  }
};

// optional

// Update a subcategory
export const updateSubcategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Validate input using Zod
    const validatedData = SubcategorySchema.parse(req.body);

    // Check if category exists
    if (validatedData.category) {
      const category = await Category.findById(validatedData.category);
      if (!category) {
        res.status(404).json({ error: "Category not found" });
        return; // Prevent further code execution
      }
    }

    // Update subcategory
    const subcategory = await Subcategory.findByIdAndUpdate(
      req.params.id,
      validatedData,
      { new: true, runValidators: true }
    );

    if (!subcategory) {
      res.status(404).json({ error: "Subcategory not found" });
      return; // Prevent further code execution
    }

    res.status(200).json(subcategory); // Send the response, don't return it
  } catch (error) {
    console.error("Error updating subcategory:", error);

    // Handle Zod validation error
    if (error instanceof ZodError) {
      res.status(400).json({ error: error.flatten() });
      return; // Prevent further code execution
    }

    // Handle Mongoose validation error
    if (error instanceof mongoose.Error.ValidationError) {
      res.status(400).json({ error: error.errors });
      return; // Prevent further code execution
    }

    res.status(500).json({ error: "Failed to update subcategory" });
  }
};
// Delete a subcategory
export const deleteSubcategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Check if subcategory has videos
    const videos = await Video.find({ subcategory: req.params.id });
    if (videos.length > 0) {
      res.status(400).json({
        error: "Cannot delete subcategory with videos. Delete videos first.",
      });
      return; // Prevent further code execution
    }

    // First get the subcategory to know which category it belongs to
    const subcategory = await Subcategory.findById(req.params.id);
    if (!subcategory) {
      res.status(404).json({ error: "Subcategory not found" });
      return; // Prevent further code execution
    }

    // Delete subcategory
    await Subcategory.findByIdAndDelete(req.params.id);

    // Remove subcategory reference from its category
    await Category.findByIdAndUpdate(subcategory.category, {
      $pull: { subcategories: req.params.id },
    });

    res.status(200).json({ message: "Subcategory deleted successfully" }); // Send the response, don't return it
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
