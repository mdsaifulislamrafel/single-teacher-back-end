import { Request, Response } from "express";
import Video from "../models/Video";
import Subcategory from "../models/Subcategory";
import fs from "fs";
import cloudinary from "../config/cloudinary";
import { UploadApiResponse } from "cloudinary";
import { UploadApiErrorResponse } from "cloudinary";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export const createVideo = async (req: MulterRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Video file is required" });
    }

    const { title, description, subcategory } = req.body;
    const filePath = req.file.path;

    if (!title || !subcategory) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: "Title and subcategory are required" });
    }

    // Upload the video to Cloudinary
    const uploadResult: UploadApiResponse | UploadApiErrorResponse = await cloudinary.uploader.upload(filePath, {
      resource_type: "video",
      folder: "videos", 
      public_id: title.replace(/\s+/g, "_").toLowerCase(),
      overwrite: false,
    });

    // Calculate the video duration
    const duration = uploadResult.duration ? Math.round(uploadResult.duration) : 0;

    // Create the video in the database
    const video = await Video.create({
      title,
      description,
      url: uploadResult.secure_url,
      cloudinaryId: uploadResult.public_id,
      duration,
      subcategory: subcategory,
      unlocked: false, // Set unlocked to false initially
      sequence: 0, // Default sequence
      
    });

    // Update the Subcategory document with the new video
    await Subcategory.findByIdAndUpdate(subcategory, {
      $push: { videos: video._id },
    });

    // Clean up temporary file
    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting temp file:", err);
    });

    res.status(201).json(video); // Return the newly created video
  } catch (error) {
    if (req.file?.path) fs.unlinkSync(req.file.path); // Cleanup on error
    console.error("Error creating video:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getVideos = async (req: Request, res: Response) => {
  try {
    const { subcategoryId } = req.params;
    const videos = await Video.find({ subcategory: subcategoryId })
      .sort({ createdAt: -1 });
    res.status(200).json(videos);
  } catch (error: unknown) {
    res.status(500).json({ error: "Failed to fetch videos" });
  }
};

export const deleteVideo = async (req: Request, res: Response) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: "Video not found" });

    // Cloudinary থেকে ভিডিও ডিলিট করুন
    if (video.cloudinaryId) {
      await cloudinary.uploader.destroy(video.cloudinaryId, {
        resource_type: "video"
      });
    }

    // ডেটাবেস থেকে ভিডিও ডিলিট করুন
    await Video.findByIdAndDelete(req.params.id);
    
    // সাবক্যাটাগরি থেকে ভিডিও রেফারেন্স রিমুভ করুন
    await Subcategory.updateMany(
      { videos: req.params.id },
      { $pull: { videos: req.params.id } }
    );

    res.status(200).json({ message: "Video deleted successfully" });
  } catch (error: unknown) {
    console.error("Error deleting video:", error);
    res.status(500).json({ 
      error: "Failed to delete video",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};