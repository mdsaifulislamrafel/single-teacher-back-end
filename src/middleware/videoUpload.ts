import multer from 'multer';
import path from 'path';

// টেম্পোরারি স্টোরেজ কনফিগারেশন
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'video-' + uniqueSuffix + ext);
  }
});

const videoUpload = multer({
  storage: storage,
  limits: { 
    fileSize: 500 * 1024 * 1024, // 500MB
    files: 1 // শুধুমাত্র একটি ফাইল
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'video/mp4', 
      'video/webm', 
      'video/quicktime', 
      'video/x-msvideo',
      'video/x-matroska'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  }
});

export default videoUpload;