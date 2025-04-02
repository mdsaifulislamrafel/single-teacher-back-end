import express from "express"
import {
  getVideos,
  // getVideoById,
  createVideo,
  // updateVideo,
  deleteVideo,
  // checkVideoAccess,
  // markVideoCompleted,
} from "../controllers/videoController"
import { authenticate, isAdmin } from "../middleware/auth"
import videoUpload from "../middleware/videoUpload";

const router = express.Router()


// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + '-' + file.originalname);
//   }
// });

// const upload = multer({ 
//   storage: storage,
//   limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
//     if (allowedTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only MP4, MOV, and AVI files are allowed'));
//     }
//   }
// });

// Public routes
router.get("/", getVideos);
router.post("/", authenticate, isAdmin, videoUpload.single('video'), createVideo);
router.delete("/:id", authenticate, isAdmin, deleteVideo);



export default router

