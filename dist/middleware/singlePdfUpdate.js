"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.singlePdfUpdate = void 0;
const multer_1 = __importDefault(require("multer"));
// Storage configuration
const storage = multer_1.default.memoryStorage();
// File filter to only allow PDFs
const fileFilter = (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
        cb(null, true);
    }
    else {
        cb(new Error("Only PDF files are allowed"));
    }
};
// Multer configuration
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter,
});
// Middleware for single PDF upload
exports.singlePdfUpdate = upload.single('file');
