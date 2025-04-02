import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Secure video upload configuration
export const uploadVideo = async (filePath: string, folder: string = 'secure-videos') => {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: 'video',
        folder: folder,
        use_filename: true,
        unique_filename: false,
        overwrite: true,
        chunk_size: 6000000,
      });
  
      if (!result.secure_url) {
        throw new Error('Cloudinary upload failed - no URL returned');
      }
  
      return {
        publicId: result.public_id,
        secureUrl: result.secure_url,
        duration: Math.round(result.duration || 0),
        width: result.width,
        height: result.height
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload video to Cloudinary');
    }
  };
  
  export const getSecureVideoUrl = (publicId: string) => {
    return cloudinary.url(publicId, {
      resource_type: 'video',
      secure: true,
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiration
    });
  };

// Delete video from Cloudinary
export const deleteVideo = async (publicId: string) => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
    return true;
  } catch (error) {
    console.error('Error deleting video:', error);
    throw new Error('Failed to delete video from Cloudinary');
  }
};

// Configure multer storage for Cloudinary
export const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      resource_type: 'auto',
      allowed_formats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
      transformation: [{ width: 1280, height: 720, crop: 'limit' }],
      folder: 'temp-uploads' // This is the correct way to specify folder
    };
  }
});