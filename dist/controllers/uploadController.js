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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadVideo = exports.uploadFile = void 0;
const fs_1 = __importDefault(require("fs"));
const vimeoService_1 = require("../services/vimeoService");
const Video_1 = __importDefault(require("../models/Video"));
const Subcategory_1 = __importDefault(require("../models/Subcategory"));
// Get file size in a readable format
const getFileSize = (filePath) => {
    const stats = fs_1.default.statSync(filePath);
    const fileSizeInBytes = stats.size;
    const fileSizeInMB = fileSizeInBytes / (1024 * 1024);
    return fileSizeInMB.toFixed(2) + " MB";
};
// Handle PDF file upload
const uploadFile = (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: "No file uploaded" });
            return;
        }
        // Get the server's base URL
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        // Create a URL for the uploaded file
        const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
        // Get file size
        const fileSize = getFileSize(req.file.path);
        // Return success response with file details
        res.status(200).json({
            success: true,
            file: {
                filename: req.file.filename,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: fileSize,
                url: fileUrl,
            },
        });
    }
    catch (error) {
        console.error("Error uploading file:", error);
        res.status(500).json({ error: "Failed to upload file" });
    }
};
exports.uploadFile = uploadFile;
// Upload a video
const uploadVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { title, description, subcategoryId } = req.body;
        const filePath = (_a = req.file) === null || _a === void 0 ? void 0 : _a.path;
        if (!filePath) {
            res.status(400).json({ error: "No file uploaded" });
            return;
        }
        const vimeoResult = yield (0, vimeoService_1.uploadToVimeo)(filePath, title, description || "");
        const video = yield Video_1.default.create({
            title,
            description,
            url: vimeoResult.vimeoUrl,
            vimeoId: vimeoResult.vimeoId,
            duration: vimeoResult.duration,
            subcategory: subcategoryId,
        });
        yield Subcategory_1.default.findByIdAndUpdate(subcategoryId, {
            $push: { videos: video._id },
        });
        res.status(201).json(video);
    }
    catch (error) {
        console.error("Error uploading video:", error);
        res.status(500).json({ error: "Failed to upload video" });
    }
});
exports.uploadVideo = uploadVideo;
