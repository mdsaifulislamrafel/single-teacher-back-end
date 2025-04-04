import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import FormData from "form-data";
import path from "path";

dotenv.config();

const VDOCIPHER_API_SECRET = process.env.VDOCIPHER_API_SECRET || "wpbIP2C5BjBM5POiFW6nGWHmQsSJeclXaVUWKzGIGpzERVU7MxtyYJNtp0aXQJBG";

export class VdoCipherError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VdoCipherError";
  }
}

export class VdoCipherQuotaError extends VdoCipherError {
  constructor(message: string) {
    super(message);
    this.name = "VdoCipherQuotaError";
  }
}

export class VdoCipherUploadError extends VdoCipherError {
  constructor(message: string) {
    super(message);
    this.name = "VdoCipherUploadError";
  }
}

const vdoCipherClient = axios.create({
  baseURL: "https://dev.vdocipher.com/api",
  headers: {
    Authorization: `Apisecret ${VDOCIPHER_API_SECRET}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30000,
});

export const getUploadInfo = async (title: string) => {
  try {
    const response = await vdoCipherClient.put(`/videos?title=${encodeURIComponent(title)}`, {});
    
    if (!response.data?.videoId || !response.data?.clientPayload) {
      throw new VdoCipherError("Invalid response structure from VdoCipher API");
    }

    const { clientPayload } = response.data;
    
    // Verify all required fields are present
    const requiredFields = [
      'policy', 
      'key',
      'x-amz-signature',
      'x-amz-algorithm',
      'x-amz-date',
      'x-amz-credential',
      'uploadLink'
    ];

    for (const field of requiredFields) {
      if (!clientPayload[field]) {
        throw new VdoCipherError(`Missing required field: ${field}`);
      }
    }

    // Decode the policy to verify conditions
    const policy = JSON.parse(Buffer.from(clientPayload.policy, 'base64').toString());
    console.log("Policy conditions:", policy.conditions);

    return {
      videoId: response.data.videoId,
      uploadUrl: clientPayload.uploadLink,
      uploadFields: {
        key: clientPayload.key,
        policy: clientPayload.policy,
        'x-amz-algorithm': clientPayload['x-amz-algorithm'],
        'x-amz-credential': clientPayload['x-amz-credential'],
        'x-amz-date': clientPayload['x-amz-date'],
        'x-amz-signature': clientPayload['x-amz-signature'],
        'success_action_status': '201', // Required by S3 policy
        'success_action_redirect': '' // Required by policy condition
      }
    };
  } catch (error) {
    // Error handling remains the same
    // ...
  }
};

export const uploadVideoToVdoCipher = async (
  filePath: string,
  uploadInfo: {
    uploadUrl: string;
    uploadFields: Record<string, string>;
  }
) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new VdoCipherUploadError("File not found");
    }

    const formData = new FormData();
    const fileStats = fs.statSync(filePath);

    // Add all required fields including empty redirect
    for (const [key, value] of Object.entries(uploadInfo.uploadFields)) {
      formData.append(key, value);
    }

    // Add file with metadata
    formData.append("file", fs.createReadStream(filePath), {
      filename: path.basename(filePath),
      contentType: "video/mp4",
      knownLength: fileStats.size
    });

    console.log("Final form data fields:", Object.keys(formData));

    const response = await axios.post(uploadInfo.uploadUrl, formData, {
      headers: {
        ...formData.getHeaders(),
        'Content-Length': formData.getLengthSync()
      },
      timeout: 600000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    if (response.status !== 201) {
      throw new VdoCipherUploadError(`Upload failed with status ${response.status}`);
    }

    return true;
  } catch (error) {
    // console.error("Upload error details:", error.response?.data || error.message);
    throw new VdoCipherUploadError(
      `Failed to upload video: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

// ... rest of the functions (getVideoInfo, deleteVdoCipherVideo, listVideos) ...

export const getVideoInfo = async (videoId: string) => {
  try {
    const response = await vdoCipherClient.get(`/videos/${videoId}`);
    return response.data;
  } catch (error) {
    throw new VdoCipherError(
      `Failed to get video info: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};



export const deleteVdoCipherVideo = async (videoId: string) => {
  try {
    if (!videoId || typeof videoId !== "string") {
      console.warn("Invalid VdoCipher ID:", videoId)
      throw new VdoCipherError("Invalid video ID")
    }

    if (!VDOCIPHER_API_SECRET) {
      throw new VdoCipherError("VdoCipher API secret is not configured")
    }

    console.log(`Attempting to delete video from VdoCipher: ${videoId}`)

    // For V2 API, the API secret is passed as a query parameter
    const url = `https://api.vdocipher.com/v2/videos/${videoId}?clientSecretKey=${VDOCIPHER_API_SECRET}`

    const response = await axios.delete(url, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    console.log("VdoCipher delete response:", response.data)
    return response.data
  } catch (error: any) {
    console.error("VdoCipher deletion error:", error.response?.data || error.message)

    // Check if the error is because the video doesn't exist (already deleted)
    if (error.response?.status === 404) {
      console.log(`Video ${videoId} not found in VdoCipher (may have been already deleted)`)
      return { message: "Video not found or already deleted" }
    }

    throw new VdoCipherError(
      `Failed to delete video: ${error.response?.data?.message || error.message || "Unknown error"}`,
    )
  }
}



export const listVideos = async () => {
  try {
    const response = await vdoCipherClient.get("/videos");
    return response.data;
  } catch (error) {
    throw new VdoCipherError(
      `Failed to list videos: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

export default {
  getUploadInfo,
  uploadVideoToVdoCipher,
  getVideoInfo,
  deleteVdoCipherVideo,
  listVideos,
  VdoCipherError,
  VdoCipherQuotaError,
  VdoCipherUploadError,
};