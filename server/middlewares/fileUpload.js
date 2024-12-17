const fileUpload = (options = {}) => {
    const multer = require('multer');
    const path = require('path');
  
    // Configure storage
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, options.destination || 'uploads/');
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      }
    });
  
    // File filter
    const fileFilter = (req, file, cb) => {
      const allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'image/gif'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type'), false);
      }
    };
  
    // Create multer upload instance
    return multer({
      storage: storage,
      fileFilter: fileFilter,
      limits: {
        fileSize: options.maxSize || 5 * 1024 * 1024 // 5MB default
      }
    });
  };

module.exports = fileUpload;