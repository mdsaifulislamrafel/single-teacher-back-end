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

const router = express.Router()

// Public routes
router.get("/", getCategories);
router.post("/", authenticate, isAdmin, createCategory);
router.get("/:id/subcategories", getCategorySubcategories);

// Admin routes
router.get("/:id", getCategoryById)
router.put("/:id", authenticate, isAdmin, updateCategory)
router.delete("/:id", authenticate, isAdmin, deleteCategory)

export default router

