import express from "express"
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategorySubcategories,
} from "../controllers/categoryController"
import { authenticate, isAdmin } from "../middleware/auth"
import upload from "../middleware/upload";

const router = express.Router()

// Public routes
router.get("/", getCategories);
router.post("/", authenticate, isAdmin, upload.single('image'), createCategory);
router.get("/:id/subcategories", getCategorySubcategories);

// Admin routes
router.get("/:id", getCategoryById)
router.put("/:id", authenticate, isAdmin, upload.single('image'), updateCategory);
router.delete("/:id", authenticate, isAdmin, deleteCategory)

export default router

