import { Request, Response } from "express";
import { Book, BookSchema } from "../models/Book";
import { UpdateBookSchema } from "../models/Book";

export const createBook = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Book image is required" });
      return;
    }

    const bookData = {
      name: req.body.name,
      description: req.body.description,
      image: req.file.path,
      price: Number(req.body.price),
      imagePublicId: req.file.filename,
    };

    const validatedData = BookSchema.parse(bookData);
    const book = await Book.create(validatedData);
    res.status(201).json(book);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Invalid book data" });
  }
};

export const getAllBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const books = await Book.find({});
    res.status(200).json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

export const getBookById = async (req: Request, res: Response): Promise<void> => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      res.status(404).json({ error: "Book not found" });
      return;
    }
    res.status(200).json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const updateData: any = {
      name: req.body.name,
      description: req.body.description,
      price: Number(req.body.price),
    };

    if (req.file) {
      updateData.image = req.file.path;
      updateData.imagePublicId = req.file.filename;
    }

    const validatedData = UpdateBookSchema.parse(updateData);
    const book = await Book.findByIdAndUpdate(req.params.id, validatedData, { new: true });
    
    if (!book) {
      res.status(404).json({ error: "Book not found" });
      return;
    }
    
    res.status(200).json(book);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Invalid book data" });
  }
};

export const deleteBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      res.status(404).json({ error: "Book not found" });
      return;
    }
    res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};