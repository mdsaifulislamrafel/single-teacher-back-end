import type { Request, Response } from "express";
import Video from "../models/Video";
import Subcategory from "../models/Subcategory";
import fs from "fs";
import {
  getUploadInfo,
  uploadVideoToVdoCipher,
  getVideoInfo,
  deleteVdoCipherVideo,
  VdoCipherQuotaError,
  VdoCipherUploadError,
  VdoCipherError
} from "../config/vdecipher";
import axios from "axios";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export const createVideo = async (req: MulterRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "Video file is required" });
  }

  const { title, description, subcategory } = req.body;
  const filePath = req.file.path;

  try {
    // Validate inputs
    if (!title?.trim()) {
      throw new Error("Title is required");
    }
    if (!subcategory) {
      throw new Error("Subcategory is required");
    }

    // Validate subcategory exists
    const subcategoryExists = await Subcategory.findById(subcategory);
    if (!subcategoryExists) {
      throw new Error("Subcategory not found");
    }

    // Step 1: Get upload credentials from VdoCipher
    const uploadInfo = await getUploadInfo(title.trim());
    if (!uploadInfo?.videoId) {
      throw new VdoCipherError("Invalid upload information received");
    }

    console.log("Upload info validated:", {
      videoId: uploadInfo.videoId,
      uploadUrl: uploadInfo.uploadUrl,
      fields: Object.keys(uploadInfo.uploadFields)
    });

    // Step 2: Upload the file to VdoCipher
    await uploadVideoToVdoCipher(filePath, uploadInfo);
    console.log("File uploaded successfully");

    // Step 3: Get video metadata
    const videoInfo = await getVideoInfo(uploadInfo.videoId);
    const duration = videoInfo?.duration || 0;

    // Step 4: Create database record
    const video = await Video.create({
      title: title.trim(),
      description,
      vdoCipherId: uploadInfo.videoId,
      duration,
      subcategory,
    });

    // Step 5: Update subcategory
    await Subcategory.findByIdAndUpdate(subcategory, {
      $push: { videos: video._id },
    });

    // Clean up temporary file
    fs.unlinkSync(filePath);

    return res.status(201).json(video);
  } catch (error) {
    // Clean up file on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("Cleaned up temporary file after error");
    }

    // Handle specific error types
    if (error instanceof VdoCipherQuotaError) {
      return res.status(403).json({
        error: "quota_limit_reached",
        message: error.message,
      });
    }

    if (error instanceof VdoCipherUploadError) {
      return res.status(400).json({
        error: "upload_failed",
        message: error.message,
      });
    }

    if (error instanceof VdoCipherError) {
      return res.status(502).json({
        error: "vdocipher_error",
        message: error.message,
      });
    }

    console.error("Video creation error:", error);
    return res.status(500).json({
      error: "server_error",
      message: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};


export const getVideos = async (req: Request, res: Response) => {
  try {
    const { subcategoryId } = req.query;

    const query = subcategoryId ? { subcategory: subcategoryId } : {};
    const videos = await Video.find(query)
      
      .populate("subcategory", "name");

    res.status(200).json(videos);
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({
      error: "server_error",
      message: error instanceof Error ? error.message : "Failed to fetch videos",
    });
  }
};

export const getVideoPlaybackInfo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    const response = await axios.post(
      `https://dev.vdocipher.com/api/videos/${video.vdoCipherId}/otp`,
      { ttl: 300 },
      {
        headers: {
          Authorization: `Apisecret ${process.env.VDOCIPHER_API_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error getting playback info:", error);
    res.status(500).json({
      error: "server_error",
      message: error instanceof Error ? error.message : "Failed to get playback info",
    });
  }
};

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

export const deleteVideo = async (req: Request, res: Response) => {
  try {
    const video = await Video.findById(req.params.id)
    if (!video) {
      return res.status(404).json({ error: "Video not found" })
    }

    // Only attempt deletion if vdoCipherId exists and is valid
    if (video.vdoCipherId && typeof video.vdoCipherId === "string") {
      try {
        console.log(`Attempting to delete VdoCipher video: ${video.vdoCipherId}`)
        await deleteVdoCipherVideo(video.vdoCipherId)
        console.log(`Successfully deleted video from VdoCipher: ${video.vdoCipherId}`)
      } catch (vdoError) {
        console.error("VdoCipher deletion error:", vdoError)
        // Continue with local deletion even if VdoCipher fails
      }
    } else {
      console.log("No valid VdoCipher ID found for this video")
    }

    // Delete from database
    await Video.findByIdAndDelete(req.params.id)

    // Remove references from subcategories
    await Subcategory.updateMany({ videos: req.params.id }, { $pull: { videos: req.params.id } })

    res.status(200).json({ message: "Video deleted successfully" })
  } catch (error) {
    console.error("Error deleting video:", error)
    res.status(500).json({
      error: "server_error",
      message: error instanceof Error ? error.message : "Failed to delete video",
    })
  }
}

