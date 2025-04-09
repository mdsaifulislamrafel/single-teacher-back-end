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
exports.storage = exports.deleteVideo = exports.getSecureVideoUrl = exports.uploadVideo = void 0;
const cloudinary_1 = require("cloudinary");
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});
// Secure video upload configuration
const uploadVideo = (filePath_1, ...args_1) => __awaiter(void 0, [filePath_1, ...args_1], void 0, function* (filePath, folder = 'secure-videos') {
    try {
        const result = yield cloudinary_1.v2.uploader.upload(filePath, {
            resource_type: 'video',
            folder: folder,
            use_filename: true,
            unique_filename: false,
            overwrite: true,
            chunk_size: 6000000,
        });
        if (!result.secure_url) {
            throw new Error('Cloudinary upload failed - no URL returned');
        }
        return {
            publicId: result.public_id,
            secureUrl: result.secure_url,
            duration: Math.round(result.duration || 0),
            width: result.width,
            height: result.height
        };
    }
    catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error('Failed to upload video to Cloudinary');
    }
});
exports.uploadVideo = uploadVideo;
const getSecureVideoUrl = (publicId) => {
    return cloudinary_1.v2.url(publicId, {
        resource_type: 'video',
        secure: true,
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiration
    });
};
exports.getSecureVideoUrl = getSecureVideoUrl;
// Delete video from Cloudinary
const deleteVideo = (publicId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield cloudinary_1.v2.uploader.destroy(publicId, { resource_type: 'video' });
        return true;
    }
    catch (error) {
        console.error('Error deleting video:', error);
        throw new Error('Failed to delete video from Cloudinary');
    }
});
exports.deleteVideo = deleteVideo;
// Configure multer storage for Cloudinary
exports.storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: (req, file) => __awaiter(void 0, void 0, void 0, function* () {
        return {
            resource_type: 'auto',
            allowed_formats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
            transformation: [{ width: 1280, height: 720, crop: 'limit' }],
            folder: 'temp-uploads' // This is the correct way to specify folder
        };
    })
});
