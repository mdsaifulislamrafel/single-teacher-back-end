import { Router } from "express";
import { authenticate, isAdmin } from "../middleware/auth";
import videoUpload from "../middleware/videoUpload";
import {
  createVideo,
  deleteVideo,
  getVideoPlaybackInfo,
  getVideos,
} from "../controllers/videoController";
import { listVideos } from "../config/vdecipher";

const router = Router();

// Public routes
router.get("/", getVideos);
router.get("/:id/playback", getVideoPlaybackInfo);

// Protected admin routes
router.post(
  "/",
  authenticate,
  isAdmin,
  videoUpload.single("video"),
  createVideo
);

router.delete("/:id", authenticate, isAdmin, deleteVideo);

// Video management route
router.get("/manage/quota", authenticate, isAdmin, async (req, res) => {
  try {
    const videos = await listVideos();
    res.status(200).json(videos);
  } catch (error) {
    res.status(500).json({
      error: "server_error",
      message:
        error instanceof Error ? error.message : "Failed to fetch quota info",
    });
  }
});

// router.patch("/:id", updateVideoIsPlaying);

export default router;
