"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBook = exports.updateBook = exports.getBookById = exports.getAllBooks = exports.createBook = void 0;
const Book_1 = require("../models/Book");
const Book_2 = require("../models/Book");
const createBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const validatedData = Book_1.BookSchema.parse(bookData);
        const book = yield Book_1.Book.create(validatedData);
        res.status(201).json(book);
    }
    catch (error) {
        console.error(error);
        res.status(400).json({ error: "Invalid book data" });
    }
});
exports.createBook = createBook;
const getAllBooks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const books = yield Book_1.Book.find({});
        res.status(200).json(books);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});
exports.getAllBooks = getAllBooks;
const getBookById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const book = yield Book_1.Book.findById(req.params.id);
        if (!book) {
            res.status(404).json({ error: "Book not found" });
            return;
        }
        res.status(200).json(book);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});
exports.getBookById = getBookById;
const updateBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updateData = {
            name: req.body.name,
            description: req.body.description,
            price: Number(req.body.price),
        };
        if (req.file) {
            updateData.image = req.file.path;
            updateData.imagePublicId = req.file.filename;
        }
        const validatedData = Book_2.UpdateBookSchema.parse(updateData);
        const book = yield Book_1.Book.findByIdAndUpdate(req.params.id, validatedData, { new: true });
        if (!book) {
            res.status(404).json({ error: "Book not found" });
            return;
        }
        res.status(200).json(book);
    }
    catch (error) {
        console.error(error);
        res.status(400).json({ error: "Invalid book data" });
    }
});
exports.updateBook = updateBook;
const deleteBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const book = yield Book_1.Book.findByIdAndDelete(req.params.id);
        if (!book) {
            res.status(404).json({ error: "Book not found" });
            return;
        }
        res.status(200).json({ message: "Book deleted successfully" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});
exports.deleteBook = deleteBook;
