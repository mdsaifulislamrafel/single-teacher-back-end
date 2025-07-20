"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Book = exports.UpdateBookSchema = exports.BookSchema = void 0;
const mongoose_1 = require("mongoose");
const zod_1 = require("zod");
// Zod validation schema for creation
exports.BookSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Name must be at least 2 characters"),
    description: zod_1.z.string().min(10, "Description must be at least 10 characters"),
    image: zod_1.z.string().url("Invalid image URL"),
    price: zod_1.z.number().positive("Price must be a positive number"),
    imagePublicId: zod_1.z.string().optional(),
});
// Zod validation schema for updates (all fields optional except ID)
exports.UpdateBookSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Name must be at least 2 characters").optional(),
    description: zod_1.z.string().min(10, "Description must be at least 10 characters").optional(),
    image: zod_1.z.string().url("Invalid image URL").optional(),
    price: zod_1.z.number().positive("Price must be a positive number").optional(),
    imagePublicId: zod_1.z.string().optional(),
}).partial(); // Makes all fields optional
const bookSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        unique: true,
        trim: true,
        minlength: [2, "Name must be at least 2 characters"],
    },
    description: {
        type: String,
        required: [true, "Description is required"],
        trim: true,
        minlength: [10, "Description must be at least 10 characters"],
    },
    image: {
        type: String,
        required: [true, "Image URL is required"],
    },
    price: {
        type: Number,
        required: [true, "Price is required"],
        min: [0, "Price can't be negative"],
    },
    imagePublicId: {
        type: String,
    },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: (doc, ret) => {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    },
    toObject: {
        virtuals: true
    }
});
// Add virtual population for category details
bookSchema.virtual('categoryDetails', {
    ref: 'Category',
    localField: 'category',
    foreignField: '_id',
    justOne: true
});
exports.Book = (0, mongoose_1.model)("Book", bookSchema);
