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
exports.deleteFromVimeo = exports.uploadToVimeo = void 0;
const vimeo_1 = require("vimeo");
const fs_1 = __importDefault(require("fs"));
const client = new vimeo_1.Vimeo(process.env.VIMEO_CLIENT_ID || 'a3169822ff3e9562d6619ce23781c0a9c6c51d8d', process.env.VIMEO_CLIENT_SECRET || '1LfaCHzyQXw1GtMppZG3KP3HTIAHSyX0JXCal8PvSC3fLJfR8CsYc3jjlaMzOLydgfKdJdikEDYWO5jEH01YvVIV2j7rjPs75M8PD5fuXKkH3QdceWSsQzmt8zEh/bWX', process.env.VIMEO_ACCESS_TOKEN || 'd04de225245cbc3c52133c461206efb7');
const uploadToVimeo = (filePath_1, title_1, ...args_1) => __awaiter(void 0, [filePath_1, title_1, ...args_1], void 0, function* (filePath, title, description = "") {
    return new Promise((resolve, reject) => {
        // ✅ ফাইল চেক
        if (!fs_1.default.existsSync(filePath)) {
            return reject(new Error(`File not found at path: ${filePath}`));
        }
        // ✅ ক্লায়েন্ট অথেনটিকেশন চেক
        client.request({
            method: "GET",
            path: "/me",
        }, (error) => {
            if (error) {
                console.error("Vimeo auth error:", error);
                return reject(new Error("Vimeo authentication failed"));
            }
            // ✅ ভিডিও আপলোড শুরু
            client.upload(filePath, {
                name: title,
                description: description,
                privacy: { view: "disable" },
            }, (uri) => {
                const videoId = uri.split("/").pop();
                if (!videoId) {
                    return reject(new Error("Invalid Vimeo URI response"));
                }
                // ✅ ভিডিও মেটাডাটা পাওয়া
                client.request(uri, (error, body) => {
                    if (error) {
                        console.error("Error getting video metadata:", error);
                        return reject(new Error("Failed to get video metadata"));
                    }
                    resolve({
                        vimeoUrl: `https://vimeo.com/${videoId}`,
                        vimeoId: videoId,
                        duration: (body === null || body === void 0 ? void 0 : body.duration) || 0,
                    });
                });
            }, (bytesUploaded, bytesTotal) => {
                const percent = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
                console.log(`Upload progress: ${percent}%`);
            }, (error) => {
                console.error("Vimeo upload error:", error);
                reject(new Error((error === null || error === void 0 ? void 0 : error.message) || "Vimeo upload failed"));
            });
        });
    });
});
exports.uploadToVimeo = uploadToVimeo;
const deleteFromVimeo = (videoId) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        client.request({
            method: "DELETE",
            path: `/videos/${videoId}`,
        }, (error) => {
            if (error) {
                console.error("Error deleting from Vimeo:", error);
                return reject(new Error((error === null || error === void 0 ? void 0 : error.message) || "Failed to delete video"));
            }
            else {
                resolve();
            }
        });
    });
});
exports.deleteFromVimeo = deleteFromVimeo;
