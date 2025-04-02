import type { Request, Response } from "express";
import Category, { CategorySchema } from "../models/Category";
import Subcategory from "../models/Subcategory";

// Get all categories
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

// Create a new category
export const createCategory = async (req: Request, res: Response) => {
  try {
    const validatedData = CategorySchema.parse(req.body);
    const category = await Category.create(validatedData);
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: "Invalid category data" });
  }
};

// Get subcategories for a category
export const getCategorySubcategories = async (req: Request, res: Response) => {
  try {
    const subcategories = await Subcategory.find({ 
      category: req.params.id 
    }).sort({ createdAt: 1 });
    res.status(200).json(subcategories);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch subcategories" });
  }
};



// optional
// Get a single category by ID
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.status(200).json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ error: "Failed to fetch category" });
  }
};



// Update a category
export const updateCategory = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = CategorySchema.parse(req.body);

    // Update category
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      validatedData,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.status(200).json(category);
  } catch (error) {
    console.error("Error updating category:", error);

    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: "Failed to update category" });
  }
};

// Delete a category
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    // Check if category has subcategories
    const subcategories = await Subcategory.find({ category: req.params.id });

    if (subcategories.length > 0) {
      return res.status(400).json({
        error: "Cannot delete category with subcategories. Delete subcategories first.",
      });
    }

    // Delete category
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
};


