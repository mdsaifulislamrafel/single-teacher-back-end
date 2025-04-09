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
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const videoUpload_1 = __importDefault(require("../middleware/videoUpload"));
const videoController_1 = require("../controllers/videoController");
const vdecipher_1 = require("../config/vdecipher");
const router = (0, express_1.Router)();
// Public routes
router.get("/", videoController_1.getVideos);
router.get("/:id/playback", videoController_1.getVideoPlaybackInfo);
// Protected admin routes
router.post("/", auth_1.authenticate, auth_1.isAdmin, videoUpload_1.default.single("video"), videoController_1.createVideo);
router.delete("/:id", auth_1.authenticate, auth_1.isAdmin, videoController_1.deleteVideo);
// Video management route
router.get("/manage/quota", auth_1.authenticate, auth_1.isAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const videos = yield (0, vdecipher_1.listVideos)();
        res.status(200).json(videos);
    }
    catch (error) {
        res.status(500).json({
            error: "server_error",
            message: error instanceof Error ? error.message : "Failed to fetch quota info",
        });
    }
}));
// router.patch("/:id", updateVideoIsPlaying);
exports.default = router;
