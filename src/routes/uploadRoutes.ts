import express from "express"
import upload from "../middleware/upload"
import videoUpload from "../middleware/videoUpload"
import { uploadFile, uploadVideo } from "../controllers/uploadController"
import { authenticate, isAdmin } from "../middleware/auth"


const router = express.Router()

// Route for uploading PDF files
router.post("/pdf", authenticate, isAdmin, upload.single("file"), uploadFile)

// Route for uploading video files to Vimeo
router.post("/video", authenticate, isAdmin, videoUpload.single("video"), uploadVideo)

export default router