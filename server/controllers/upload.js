exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const imagePath = `/uploads/articles/${req.file.filename}`;
        res.json({ imagePath });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
