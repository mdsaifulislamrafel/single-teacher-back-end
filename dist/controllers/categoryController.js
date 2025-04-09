"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.getCategoryById = exports.getCategorySubcategories = exports.createCategory = exports.getCategories = void 0;
const Category_1 = __importStar(require("../models/Category"));
const Subcategory_1 = __importDefault(require("../models/Subcategory"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
// Get all categories
const getCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield Category_1.default.find()
            .sort({ createdAt: -1 })
            .populate({
            path: "subcategories",
            populate: {
                path: "videos",
            },
        });
        res.status(200).json(categories);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch categories" });
    }
});
exports.getCategories = getCategories;
// Create a new category
const createCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if file exists
        if (!req.file) {
            res.status(400).json({ error: "Category image is required" });
            return; // Make sure we return after sending the response
        }
        // The file is already uploaded to Cloudinary by the middleware
        const categoryData = {
            name: req.body.name,
            description: req.body.description,
            image: req.file.path,
            price: req.body.price,
        };
        // Validate data with Zod schema
        const validatedData = Category_1.CategorySchema.parse(categoryData);
        // Create category in the database
        const category = yield Category_1.default.create(validatedData);
        // Respond with the created category
        res.status(201).json(category);
    }
    catch (error) {
        console.error(error);
        res.status(400).json({ error: "Invalid category data" });
    }
});
exports.createCategory = createCategory;
// Get subcategories for a category
const getCategorySubcategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const subcategories = yield Subcategory_1.default.find({
            category: req.params.id,
        }).sort({ createdAt: 1 });
        res.status(200).json(subcategories);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch subcategories" });
    }
});
exports.getCategorySubcategories = getCategorySubcategories;
// optional
// Get a single category by ID
const getCategoryById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const category = yield Category_1.default.findById(req.params.id);
        if (!category) {
            res.status(404).json({ error: "Category not found" });
            return; // Ensure we return after sending a response
        }
        res.status(200).json(category);
    }
    catch (error) {
        console.error("Error fetching category:", error);
        res.status(500).json({ error: "Failed to fetch category" });
    }
});
exports.getCategoryById = getCategoryById;
// Update a category
const updateCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const category = yield Category_1.default.findById(req.params.id);
        if (!category) {
            res.status(404).json({ error: "Category not found" });
            return; // Ensure we return after sending a response
        }
        let imageUrl = category.image;
        let imagePublicId = category.imagePublicId;
        // If new image is uploaded
        if (req.file) {
            // Delete old image from Cloudinary if exists
            if (imagePublicId) {
                yield cloudinary_1.default.uploader.destroy(imagePublicId);
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
            price: req.body.price,
            imagePublicId: imagePublicId,
        };
        // Validate and update
        const validatedData = Category_1.CategorySchema.parse(updateData);
        const updatedCategory = yield Category_1.default.findByIdAndUpdate(req.params.id, validatedData, { new: true, runValidators: true });
        res.status(200).json(updatedCategory);
    }
    catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({ error: "Failed to update category" });
    }
});
exports.updateCategory = updateCategory;
// Delete a category
const deleteCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if category has subcategories
        const subcategories = yield Subcategory_1.default.find({ category: req.params.id });
        if (subcategories.length > 0) {
            res.status(400).json({
                error: "Cannot delete category with subcategories. Delete subcategories first.",
            });
            return; // Ensure we return after sending a response
        }
        // Delete category
        const category = yield Category_1.default.findByIdAndDelete(req.params.id);
        if (!category) {
            res.status(404).json({ error: "Category not found" });
            return; // Ensure we return after sending a response
        }
        res.status(200).json({ message: "Category deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ error: "Failed to delete category" });
    }
});
exports.deleteCategory = deleteCategory;
