const express = require('express');
const router = express.Router();
const upload = require('../config/multerConfig');
const { authenticate } = require('../middlewares/authMiddleware');

router.post('/article-image', authenticate, (req, res, next) => {
    console.log('Upload request received');
    console.log('Headers:', req.headers);
    
    upload.single('image')(req, res, function(err) {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({ message: err.message });
        }
        
        console.log('File received:', req.file);
        
        if (!req.file) {
            console.error('No file in request');
            return res.status(400).json({ message: 'No file uploaded' });
        }

        try {
            const imagePath = `/uploads/articles/${req.file.filename}`;
            console.log('File saved at:', imagePath);
            res.json({ imagePath });
        } catch (error) {
            console.error('Processing error:', error);
            res.status(500).json({ message: error.message });
        }
    });
});

module.exports = router;