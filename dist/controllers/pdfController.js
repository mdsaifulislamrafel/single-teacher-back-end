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
exports.deletePDF = exports.updatePDF = exports.createPDF = exports.getPDFById = exports.getPDFs = void 0;
const PDF_1 = __importStar(require("../models/PDF"));
const Category_1 = __importDefault(require("../models/Category"));
const Subcategory_1 = __importDefault(require("../models/Subcategory"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
// Get all PDFs
const getPDFs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { category, subcategory } = req.query;
        // Build filter object based on provided query parameters
        const filter = {};
        if (subcategory) {
            filter.subcategory = subcategory;
        }
        if (category) {
            filter.category = category;
        }
        const pdfs = yield PDF_1.default.find(filter)
            .populate("category", "name image")
            .populate("subcategory", "name")
            .sort({ createdAt: -1 });
        res.status(200).json(pdfs);
    }
    catch (error) {
        console.error("Error fetching PDFs:", error);
        res.status(500).json({ error: "Failed to fetch PDFs" });
    }
});
exports.getPDFs = getPDFs;
// Get a single PDF by ID
const getPDFById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pdf = yield PDF_1.default.findById(req.params.id)
            .populate('category', 'name')
            .populate('subcategory', 'name');
        if (!pdf) {
            res.status(404).json({ error: 'PDF not found' });
            return;
        }
        res.status(200).json(pdf);
    }
    catch (error) {
        console.error('Error fetching PDF:', error);
        res.status(500).json({ error: 'Failed to fetch PDF' });
    }
});
exports.getPDFById = getPDFById;
const uploadPDFToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.default.uploader.upload_stream({
            resource_type: "auto",
            folder: "pdfs",
            public_id: `pdf_${Date.now()}`,
            format: "pdf",
        }, (error, result) => {
            if (error)
                reject(error);
            else
                resolve(result);
        });
        uploadStream.end(buffer);
    });
};
// Create a new PDF
const createPDF = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!req.file) {
            res.status(400).json({ error: 'PDF file is required' });
            return;
        }
        const result = yield uploadPDFToCloudinary(req.file.buffer);
        const pdfData = {
            title: req.body.title,
            description: req.body.description,
            category: req.body.category,
            subcategory: req.body.subcategory,
            price: Number(req.body.price),
            fileUrl: result.secure_url,
            fileSize: `${(result.bytes / (1024 * 1024)).toFixed(2)} MB`,
            publicId: result.public_id,
        };
        const validatedData = PDF_1.PDFSchema.parse(pdfData);
        const category = yield Category_1.default.findById(validatedData.category);
        if (!category) {
            yield cloudinary_1.default.uploader.destroy(result.public_id);
            res.status(404).json({ error: 'Category not found' });
            return;
        }
        const subcategory = yield Subcategory_1.default.findById(validatedData.subcategory);
        if (!subcategory) {
            yield cloudinary_1.default.uploader.destroy(result.public_id);
            res.status(404).json({ error: 'Subcategory not found' });
            return;
        }
        const pdf = yield PDF_1.default.create(validatedData);
        res.status(201).json(Object.assign(Object.assign({}, pdf.toObject()), { message: 'PDF created successfully', downloadUrl: result.secure_url }));
    }
    catch (error) {
        console.error('Error creating PDF:', error);
        if ((_a = error.result) === null || _a === void 0 ? void 0 : _a.public_id) {
            yield cloudinary_1.default.uploader.destroy(error.result.public_id).catch(console.error);
        }
        if (error) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        if (error.http_code === 400) {
            res.status(400).json({ error: 'Invalid file format. Only PDFs are allowed.' });
            return;
        }
        if (error.http_code === 413) {
            res.status(413).json({ error: 'File too large. Maximum size is 100MB.' });
            return;
        }
        res.status(500).json({ error: 'Failed to create PDF', details: error.message });
    }
});
exports.createPDF = createPDF;
// Update a PDF
const updatePDF = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const existingPDF = yield PDF_1.default.findById(id);
        if (!existingPDF) {
            res.status(404).json({ error: 'PDF not found' });
            return;
        }
        let fileUrl = existingPDF.fileUrl;
        let fileSize = existingPDF.fileSize;
        let publicId = existingPDF.publicId;
        if (req.file) {
            if (publicId) {
                yield cloudinary_1.default.uploader.destroy(publicId);
            }
            const result = yield uploadPDFToCloudinary(req.file.buffer);
            fileUrl = result.secure_url;
            fileSize = `${(result.bytes / (1024 * 1024)).toFixed(2)} MB`;
            publicId = result.public_id;
        }
        const updateData = {
            title: req.body.title,
            description: req.body.description,
            category: req.body.category,
            subcategory: req.body.subcategory,
            price: Number(req.body.price),
            fileUrl,
            fileSize,
            publicId,
        };
        const validatedData = PDF_1.PDFSchema.parse(updateData);
        const category = yield Category_1.default.findById(validatedData.category);
        if (!category) {
            res.status(404).json({ error: 'Category not found' });
            return;
        }
        const subcategory = yield Subcategory_1.default.findById(validatedData.subcategory);
        if (!subcategory) {
            res.status(404).json({ error: 'Subcategory not found' });
            return;
        }
        const updatedPDF = yield PDF_1.default.findByIdAndUpdate(id, validatedData, {
            new: true,
            runValidators: true,
        });
        if (!updatedPDF) {
            res.status(404).json({ error: 'PDF not found after update attempt' });
            return;
        }
        res.status(200).json(Object.assign(Object.assign({}, updatedPDF.toObject()), { message: 'PDF updated successfully' }));
    }
    catch (error) {
        console.error('Error updating PDF:', error);
        if (error === null || error === void 0 ? void 0 : error.errors) {
            res.status(400).json({ error: error.errors });
            return;
        }
        if (error) {
            res.status(400).json({ error: error.errors });
            return;
        }
        res.status(500).json({ error: 'Failed to update PDF' });
    }
});
exports.updatePDF = updatePDF;
const deletePDF = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pdf = yield PDF_1.default.findById(req.params.id);
        if (!pdf) {
            res.status(404).json({ error: 'PDF not found' });
            return;
        }
        if (pdf.publicId) {
            yield cloudinary_1.default.uploader.destroy(pdf.publicId);
        }
        yield PDF_1.default.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'PDF deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting PDF:', error);
        res.status(500).json({ error: 'Failed to delete PDF' });
    }
});
exports.deletePDF = deletePDF;
