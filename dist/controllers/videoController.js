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
exports.deleteVideo = exports.getVideoPlaybackInfo = exports.getVideos = exports.createVideo = void 0;
const Video_1 = __importDefault(require("../models/Video"));
const Subcategory_1 = __importDefault(require("../models/Subcategory"));
const fs_1 = __importDefault(require("fs"));
const vdecipher_1 = require("../config/vdecipher");
const axios_1 = __importDefault(require("axios"));
const createVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.file) {
        res.status(400).json({ error: "Video file is required" });
        return;
    }
    const { title, description, subcategory } = req.body;
    const filePath = req.file.path;
    try {
        if (!(title === null || title === void 0 ? void 0 : title.trim()))
            throw new Error("Title is required");
        if (!subcategory)
            throw new Error("Subcategory is required");
        const subcategoryExists = yield Subcategory_1.default.findById(subcategory);
        if (!subcategoryExists)
            throw new Error("Subcategory not found");
        const uploadInfo = yield (0, vdecipher_1.getUploadInfo)(title.trim());
        if (!(uploadInfo === null || uploadInfo === void 0 ? void 0 : uploadInfo.videoId))
            throw new vdecipher_1.VdoCipherError("Invalid upload information received");
        console.log("Upload info validated:", {
            videoId: uploadInfo.videoId,
            uploadUrl: uploadInfo.uploadUrl,
            fields: Object.keys(uploadInfo.uploadFields),
        });
        yield (0, vdecipher_1.uploadVideoToVdoCipher)(filePath, uploadInfo);
        console.log("File uploaded successfully");
        const videoInfo = yield (0, vdecipher_1.getVideoInfo)(uploadInfo.videoId);
        const duration = (videoInfo === null || videoInfo === void 0 ? void 0 : videoInfo.duration) || 0;
        const video = yield Video_1.default.create({
            title: title.trim(),
            description,
            vdoCipherId: uploadInfo.videoId,
            duration,
            subcategory,
        });
        yield Subcategory_1.default.findByIdAndUpdate(subcategory, {
            $push: { videos: video._id },
        });
        fs_1.default.unlinkSync(filePath);
        res.status(201).json(video);
    }
    catch (error) {
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
            console.log("Cleaned up temporary file after error");
        }
        if (error instanceof vdecipher_1.VdoCipherQuotaError) {
            res.status(403).json({ error: "quota_limit_reached", message: error.message });
            return;
        }
        if (error instanceof vdecipher_1.VdoCipherUploadError) {
            res.status(400).json({ error: "upload_failed", message: error.message });
            return;
        }
        if (error instanceof vdecipher_1.VdoCipherError) {
            res.status(502).json({ error: "vdocipher_error", message: error.message });
            return;
        }
        console.error("Video creation error:", error);
        res.status(500).json({
            error: "server_error",
            message: error instanceof Error ? error.message : "Unknown error occurred",
        });
    }
});
exports.createVideo = createVideo;
const getVideos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { subcategoryId } = req.query;
        const query = subcategoryId ? { subcategory: subcategoryId } : {};
        const videos = yield Video_1.default.find(query)
            .populate("subcategory", "name");
        res.status(200).json(videos);
    }
    catch (error) {
        console.error("Error fetching videos:", error);
        res.status(500).json({
            error: "server_error",
            message: error instanceof Error ? error.message : "Failed to fetch videos",
        });
    }
});
exports.getVideos = getVideos;
const getVideoPlaybackInfo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const video = yield Video_1.default.findById(id);
        if (!video) {
            res.status(404).json({ error: "Video not found" });
            return;
        }
        const response = yield axios_1.default.post(`https://dev.vdocipher.com/api/videos/${video.vdoCipherId}/otp`, { ttl: 300 }, {
            headers: {
                Authorization: `Apisecret ${process.env.VDOCIPHER_API_SECRET}`,
                "Content-Type": "application/json",
            },
        });
        res.status(200).json(response.data);
    }
    catch (error) {
        console.error("Error getting playback info:", error);
        res.status(500).json({
            error: "server_error",
            message: (error === null || error === void 0 ? void 0 : error.message) || "Failed to get playback info",
        });
    }
});
exports.getVideoPlaybackInfo = getVideoPlaybackInfo;
// export const deleteVideo = async (req: Request, res: Response) => {
//   try {
//     const video = await Video.findById(req.params.id);
//     if (!video) {
//       return res.status(404).json({ error: "Video not found" });
//     }
//     // Only attempt deletion if vdoCipherId exists and is valid
//     if (video.vdoCipherId && typeof video.vdoCipherId === 'string') {
//       try {
//         await deleteVdoCipherVideo(video.vdoCipherId);
//       } catch (vdoError) {
//         console.error("VdoCipher deletion error:", vdoError);
//         // Continue with local deletion even if VdoCipher fails
//       }
//     }
//     // Rest of the deletion logic...
//     await Video.findByIdAndDelete(req.params.id);
//     await Subcategory.updateMany(
//       { videos: req.params.id },
//       { $pull: { videos: req.params.id } }
//     );
//     res.status(200).json({ message: "Video deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting video:", error);
//     res.status(500).json({
//       error: "server_error",
//       message: error instanceof Error ? error.message : "Failed to delete video",
//     });
//   }
// };
const deleteVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const video = yield Video_1.default.findById(req.params.id);
        if (!video) {
            res.status(404).json({ error: "Video not found" });
            return;
        }
        // Delete from VdoCipher if ID exists
        if (video.vdoCipherId && typeof video.vdoCipherId === "string") {
            try {
                console.log(`Attempting to delete VdoCipher video: ${video.vdoCipherId}`);
                yield (0, vdecipher_1.deleteVdoCipherVideo)(video.vdoCipherId);
                console.log(`Successfully deleted video from VdoCipher: ${video.vdoCipherId}`);
            }
            catch (vdoError) {
                console.error("VdoCipher deletion error:", vdoError);
                // Continue with local deletion even if VdoCipher fails
            }
        }
        else {
            console.log("No valid VdoCipher ID found for this video");
        }
        yield Video_1.default.findByIdAndDelete(req.params.id);
        yield Subcategory_1.default.updateMany({ videos: req.params.id }, { $pull: { videos: req.params.id } });
        res.status(200).json({ message: "Video deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting video:", error);
        res.status(500).json({
            error: "server_error",
            message: error instanceof Error ? error.message : "Failed to delete video",
        });
    }
});
exports.deleteVideo = deleteVideo;
// export const updateVideoIsPlaying = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { id } = req.params;
//     const { isPlaying } = req.body;
//     console.log(id, isPlaying);
//     if (isPlaying === undefined) {
//       res.status(400).json({ error: "isPlaying field is required" });
//       return;
//     }
//     const video = await Video.findByIdAndUpdate(
//       id,
//       { $set: { isPlaying } },
//       { new: true, runValidators: true }
//     );
//     if (!video) {
//       res.status(404).json({ error: "Video not found" });
//       return;
//     }
//     res.status(200).json({
//       message: "Video isPlaying status updated successfully",
//       video
//     });
//   } catch (error) {
//     console.error("Error updating video isPlaying status:", error);
//     res.status(500).json({
//       error: "server_error",
//       message: error instanceof Error ? error.message : "Failed to update video status",
//     });
//   }
// };
