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
exports.checkDuplicate = exports.deleteSubcategory = exports.updateSubcategory = exports.getSubcategoryVideos = exports.getSubcategoryById = exports.createSubcategory = exports.getSubcategories = void 0;
const zod_1 = require("zod");
const mongoose_1 = __importDefault(require("mongoose"));
const Category_1 = __importDefault(require("../models/Category"));
const Video_1 = __importDefault(require("../models/Video"));
const Subcategory_1 = __importStar(require("../models/Subcategory"));
// Get all subcategories
const getSubcategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const subcategories = yield Subcategory_1.default.find()
            .populate("category", "name")
            .sort({ createdAt: -1 });
        res.status(200).json(subcategories);
    }
    catch (error) {
        console.error("Error fetching subcategories:", error);
        res.status(500).json({ error: "Failed to fetch subcategories" });
    }
});
exports.getSubcategories = getSubcategories;
// Create a new subcategory
const createSubcategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validatedData = Subcategory_1.SubcategorySchema.parse(req.body);
        const category = yield Category_1.default.findById(validatedData.category);
        if (!category) {
            res.status(404).json({ error: "Category not found" });
            return; // Prevent further code execution
        }
        const existing = yield Subcategory_1.default.findOne({
            name: validatedData.name,
            category: validatedData.category,
        });
        if (existing) {
            res.status(409).json({ error: "Subcategory already exists" });
            return; // Prevent further code execution
        }
        const subcategory = yield Subcategory_1.default.create(validatedData);
        yield Category_1.default.findByIdAndUpdate(validatedData.category, {
            $push: { subcategories: subcategory._id },
        });
        res.status(201).json(subcategory); // Send the response, don't return it
    }
    catch (error) {
        res.status(400).json({ error: "Invalid subcategory data" });
    }
});
exports.createSubcategory = createSubcategory;
// Get a single subcategory by ID
const getSubcategoryById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const subcategory = yield Subcategory_1.default.findById(req.params.id).populate("category", "name");
        if (!subcategory) {
            res.status(404).json({ error: "Subcategory not found" });
            return; // Prevent further code execution
        }
        res.status(200).json(subcategory); // Send the response, don't return it
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch subcategory" });
    }
});
exports.getSubcategoryById = getSubcategoryById;
// Get videos for a subcategory
const getSubcategoryVideos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const videos = yield Video_1.default.find({
            subcategory: req.params.id,
        }).sort({ sequence: 1 });
        res.status(200).json(videos);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch videos" });
    }
});
exports.getSubcategoryVideos = getSubcategoryVideos;
// optional
// Update a subcategory
const updateSubcategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate input using Zod
        const validatedData = Subcategory_1.SubcategorySchema.parse(req.body);
        // Check if category exists
        if (validatedData.category) {
            const category = yield Category_1.default.findById(validatedData.category);
            if (!category) {
                res.status(404).json({ error: "Category not found" });
                return; // Prevent further code execution
            }
        }
        // Update subcategory
        const subcategory = yield Subcategory_1.default.findByIdAndUpdate(req.params.id, validatedData, { new: true, runValidators: true });
        if (!subcategory) {
            res.status(404).json({ error: "Subcategory not found" });
            return; // Prevent further code execution
        }
        res.status(200).json(subcategory); // Send the response, don't return it
    }
    catch (error) {
        console.error("Error updating subcategory:", error);
        // Handle Zod validation error
        if (error instanceof zod_1.ZodError) {
            res.status(400).json({ error: error.flatten() });
            return; // Prevent further code execution
        }
        // Handle Mongoose validation error
        if (error instanceof mongoose_1.default.Error.ValidationError) {
            res.status(400).json({ error: error.errors });
            return; // Prevent further code execution
        }
        res.status(500).json({ error: "Failed to update subcategory" });
    }
});
exports.updateSubcategory = updateSubcategory;
// Delete a subcategory
const deleteSubcategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if subcategory has videos
        const videos = yield Video_1.default.find({ subcategory: req.params.id });
        if (videos.length > 0) {
            res.status(400).json({
                error: "Cannot delete subcategory with videos. Delete videos first.",
            });
            return; // Prevent further code execution
        }
        // First get the subcategory to know which category it belongs to
        const subcategory = yield Subcategory_1.default.findById(req.params.id);
        if (!subcategory) {
            res.status(404).json({ error: "Subcategory not found" });
            return; // Prevent further code execution
        }
        // Delete subcategory
        yield Subcategory_1.default.findByIdAndDelete(req.params.id);
        // Remove subcategory reference from its category
        yield Category_1.default.findByIdAndUpdate(subcategory.category, {
            $pull: { subcategories: req.params.id },
        });
        res.status(200).json({ message: "Subcategory deleted successfully" }); // Send the response, don't return it
    }
    catch (error) {
        console.error("Error deleting subcategory:", error);
        res.status(500).json({ error: "Failed to delete subcategory" });
    }
});
exports.deleteSubcategory = deleteSubcategory;
const checkDuplicate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { categoryId, name, excludeId } = req.query;
        const existingSubcategory = yield Subcategory_1.default.findOne({
            name,
            category: categoryId,
            _id: { $ne: excludeId }, // Exclude current subcategory when checking for update
        });
        res.json({ isDuplicate: !!existingSubcategory });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to check duplicate subcategory" });
    }
});
exports.checkDuplicate = checkDuplicate;
