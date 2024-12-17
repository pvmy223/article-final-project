const router = require('express').Router();
const Post = require('../models/Article');

// Tìm kiếm bài viết
router.get('/', async (req, res) => {
    const { q } = req.query;

    try {
        const posts = await Post.find({
            $text: { $search: q }
        }).limit(20);

        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
