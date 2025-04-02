import express from "express"
import {
  getSubcategories,
  getSubcategoryById,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  getSubcategoryVideos,
  checkDuplicate,
} from "../controllers/subcategoryController"
import { authenticate, isAdmin } from "../middleware/auth"

const router = express.Router()

// Public routes
router.get("/", getSubcategories);
router.post("/", authenticate, isAdmin, createSubcategory);
router.get("/:id/videos", getSubcategoryVideos);
// Check for duplicate subcategory name in same category
router.get("/check-duplicate", checkDuplicate )

// Admin routes
router.get("/:id", getSubcategoryById)
router.put("/:id", authenticate, isAdmin, updateSubcategory)
router.delete("/:id", authenticate, isAdmin, deleteSubcategory)

export default router

