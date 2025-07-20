"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const upload_1 = __importDefault(require("../middleware/upload"));
const bookController_1 = require("../controllers/bookController");
const router = express_1.default.Router();
// Create a new book
router.post("/", auth_1.authenticate, auth_1.isAdmin, upload_1.default.single('image'), bookController_1.createBook);
// Get all books
router.get("/", bookController_1.getAllBooks);
// Get a single book by ID
router.get("/:id", bookController_1.getBookById);
// Update a book
router.put("/:id", auth_1.authenticate, auth_1.isAdmin, upload_1.default.single('image'), bookController_1.updateBook);
// Delete a book
router.delete("/:id", auth_1.authenticate, auth_1.isAdmin, bookController_1.deleteBook);
exports.default = router;
