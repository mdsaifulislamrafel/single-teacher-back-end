import axios, { AxiosError } from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

interface UploadResult {
  videoId: string;
  embedInfo: {
    iframe_url: string;
  };
  otp: string;
  playbackInfo: string;
  duration: number;
}

// Retrieve environment variables from .env file
const VDO_CIPHER_API_URL = 'https://dev.vdocipher.com/api/videos';

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value.trim();
}

// Get VDO CIPHER credentials from environment variables
const VDO_CIPHER_SECRET = getEnvVar('VDO_CIPHER_SECRET');
const VDO_CIPHER_FOLDER_ID = getEnvVar('VDO_CIPHER_FOLDER_ID');

// Function to get authorization headers
function getAuthHeaders(contentType = 'application/json') {
  return {
    'Authorization': `Apisecret ${VDO_CIPHER_SECRET}`,
    'Accept': 'application/json',
    'Content-Type': contentType,
  };
}

export const uploadToVdoCipher = async (
  filePath: string,
  title: string,
  description: string = ''
): Promise<UploadResult> => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // 1. Initialize upload request
    const initResponse = await axios.post(
      VDO_CIPHER_API_URL,
      {},
      {
        params: { title, description, folderId: VDO_CIPHER_FOLDER_ID },
        headers: getAuthHeaders(),
      }
    );

    const { id: videoId, upload_link: uploadLink } = initResponse.data;

    // 2. Upload the file to the generated upload link
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    await axios.post(uploadLink, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Apisecret ${VDO_CIPHER_SECRET}`,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    // 3. Finalize the video upload
    const finalizeResponse = await axios.post(
      `${VDO_CIPHER_API_URL}/${videoId}/finalize`,
      {},
      { headers: getAuthHeaders() }
    );

    // 4. Generate OTP for playback
    const otpResponse = await axios.post(
      `${VDO_CIPHER_API_URL}/${videoId}/otp`,
      { ttl: 300 }, // 5-minute expiry
      { headers: getAuthHeaders() }
    );

    return {
      videoId,
      embedInfo: finalizeResponse.data.embed_info,
      otp: otpResponse.data.otp,
      playbackInfo: otpResponse.data.playbackInfo,
      duration: Math.round(finalizeResponse.data.duration),
    };
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    console.error('VdoCipher API Error:', {
      status: axiosError.response?.status,
      message: axiosError.response?.data?.message || 'Unknown error',
      request: {
        url: axiosError.config?.url,
        method: axiosError.config?.method,
        headers: axiosError.config?.headers,
      },
    });
    throw error;
  }
};