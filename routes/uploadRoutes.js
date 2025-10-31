// routes/uploadRoutes.js
// Зураг болон видео upload - FIXED VERSION

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');

// Upload directory үүсгэх
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Unique filename: timestamp-randomstring.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'upload-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed image types
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  // Allowed video types
  const allowedVideoTypes = /mp4|avi|mov|wmv|webm/;
  
  const ext = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;
  
  if (file.fieldname === 'image') {
    if (allowedImageTypes.test(ext) && mimetype.startsWith('image/')) {
      return cb(null, true);
    }
  } else if (file.fieldname === 'video') {
    if (allowedVideoTypes.test(ext) && mimetype.startsWith('video/')) {
      return cb(null, true);
    }
  }
  
  cb(new Error('Дэмжигдээгүй файлын төрөл!'));
};

// Multer upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: fileFilter
});

// ============================================
// UPLOAD IMAGE
// ============================================
router.post('/image', authenticateToken, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Зураг сонгоогүй байна.'
      });
    }

    // 🔥 FIX: Return FULL URL with domain (not relative path)
    const baseUrl = process.env.API_URL || 'http://localhost:5000';
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
    
    console.log('✅ Image uploaded:', fileUrl);
    
    res.json({
      success: true,
      message: 'Зураг амжилттай upload хийгдлээ!',
      data: {
        url: fileUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('❌ Image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Зураг upload хийхэд алдаа гарлаа.'
    });
  }
});

// ============================================
// UPLOAD VIDEO
// ============================================
router.post('/video', authenticateToken, upload.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Видео сонгоогүй байна.'
      });
    }

    // 🔥 FIX: Return FULL URL with domain
    const baseUrl = process.env.API_URL || 'http://localhost:5000';
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
    
    console.log('✅ Video uploaded:', fileUrl);
    
    res.json({
      success: true,
      message: 'Видео амжилттай upload хийгдлээ!',
      data: {
        url: fileUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('❌ Video upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Видео upload хийхэд алдаа гарлаа.'
    });
  }
});

// ============================================
// DELETE FILE
// ============================================
router.delete('/:filename', authenticateToken, (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Файл олдсонгүй.'
      });
    }

    // Delete file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: 'Файл амжилттай устгагдлаа!'
    });
  } catch (error) {
    console.error('❌ Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Файл устгахад алдаа гарлаа.'
    });
  }
});

module.exports = router;