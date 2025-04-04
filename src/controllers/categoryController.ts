import type { Request, Response } from "express";
import Category, { CategorySchema } from "../models/Category";
import Subcategory from "../models/Subcategory";
import cloudinary from "../config/cloudinary";

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
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ error: "Category image is required" });
    }

    // The file is already uploaded to Cloudinary by the middleware
    // so we can just use the information from req.file
    const categoryData = {
      name: req.body.name,
      description: req.body.description,
      image: req.file.path // This contains the Cloudinary URL
    };

    const validatedData = CategorySchema.parse(categoryData);
    const category = await Category.create(validatedData);
    
    res.status(201).json(category);
  } catch (error) {
    console.error(error);
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
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    let imageUrl = category.image;
    let imagePublicId = category.imagePublicId;

    // If new image is uploaded
    if (req.file) {
      // Delete old image from Cloudinary if exists
      if (imagePublicId) {
        await cloudinary.uploader.destroy(imagePublicId);
      }

      // The new image is already uploaded by multer-storage-cloudinary
      // so we can just use the URL from req.file
      imageUrl = req.file.path;
      imagePublicId = req.file.filename; // This contains the Cloudinary public_id
    }

    // Prepare update data
    const updateData = {
      name: req.body.name,
      description: req.body.description,
      image: imageUrl,
      imagePublicId: imagePublicId
    };

    // Validate and update
    const validatedData = CategorySchema.parse(updateData);
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      validatedData,
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedCategory);
  } catch (error) {
    console.error("Error updating category:", error);
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


