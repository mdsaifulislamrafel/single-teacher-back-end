"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const upload_1 = __importDefault(require("../middleware/upload"));
const videoUpload_1 = __importDefault(require("../middleware/videoUpload"));
const uploadController_1 = require("../controllers/uploadController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Route for uploading PDF files
router.post("/pdf", auth_1.authenticate, auth_1.isAdmin, upload_1.default.single("file"), uploadController_1.uploadFile);
// Route for uploading video files to Vimeo
router.post("/video", auth_1.authenticate, auth_1.isAdmin, videoUpload_1.default.single("video"), uploadController_1.uploadVideo);
exports.default = router;
