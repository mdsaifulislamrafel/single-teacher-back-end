import type { Request, Response } from "express"
import fs from "fs"
import { uploadToVimeo } from "../services/vimeoService"
import Video from "../models/Video"
import Subcategory from "../models/Subcategory"

// Get file size in a readable format
const getFileSize = (filePath: string): string => {
  const stats = fs.statSync(filePath)
  const fileSizeInBytes = stats.size
  const fileSizeInMB = fileSizeInBytes / (1024 * 1024)
  return fileSizeInMB.toFixed(2) + " MB"
}

// Handle PDF file upload
export const uploadFile = (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" })
    }

    // Get the server's base URL
    const baseUrl = `${req.protocol}://${req.get("host")}`

    // Create a URL for the uploaded file
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`

    // Get file size
    const fileSize = getFileSize(req.file.path)

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
    })
  } catch (error: any) {
    console.error("Error uploading file:", error)
    res.status(500).json({ error: "Failed to upload file" })
  }
}

// Handle video upload to Vimeo
export const uploadVideo = async (req: Request, res: Response) => {
  try {
    const { title, description, subcategoryId } = req.body;
    const filePath = req.file?.path;

    if (!filePath) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const vimeoResult = await uploadToVimeo(filePath, title, description || "");
    
    const video = await Video.create({
      title,
      description,
      url: vimeoResult.vimeoUrl,
      vimeoId: vimeoResult.vimeoId,
      duration: vimeoResult.duration,
      subcategory: subcategoryId
    });

    await Subcategory.findByIdAndUpdate(subcategoryId, {
      $push: { videos: video._id }
    });

    res.status(201).json(video);
  } catch (error) {
    console.error("Error uploading video:", error);
    res.status(500).json({ error: "Failed to upload video" });
  }
};

