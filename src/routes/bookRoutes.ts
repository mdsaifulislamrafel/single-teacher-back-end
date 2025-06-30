import express from "express";
import { authenticate, isAdmin } from "../middleware/auth";
import upload from "../middleware/upload";
import { 
  createBook, 
  getAllBooks, 
  getBookById, 
  updateBook, 
  deleteBook 
} from "../controllers/bookController";

const router = express.Router();

// Create a new book
router.post("/", authenticate, isAdmin, upload.single('image'), createBook);

// Get all books
router.get("/", getAllBooks);

// Get a single book by ID
router.get("/:id", getBookById);

// Update a book
router.put("/:id", authenticate, isAdmin, upload.single('image'), updateBook);

// Delete a book
router.delete("/:id", authenticate, isAdmin, deleteBook);

export default router;