const router = require('express').Router();
const Post = require('../models/Article');
const { verifyToken, verifyWriter } = require('../middlewares/authMiddleware');

// Lấy danh sách bài viết với phân trang
router.get('/', async (req, res) => {
    const { page = 1, limit = 10, category, tag } = req.query;

    try {
        let filter = {};
        if (category) filter.category = category;
        if (tag) filter.tags = tag;

        const posts = await Post.find(filter)
            .populate('category')
            .populate('tags')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Đăng bài viết mới (phóng viên)
router.post('/', verifyToken, verifyWriter, async (req, res) => {
    try {
        const { title, content, abstract, category, tags, premium } = req.body;

        const newPost = new Post({
            title,
            slug: title.toLowerCase().replace(/ /g, '-'),
            content,
            abstract,
            category,
            tags,
            premium,
            author: req.user.id
        });

        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Xem chi tiết bài viết
router.get('/:slug', async (req, res) => {
    try {
        const post = await Post.findOne({ slug: req.params.slug })
            .populate('category')
            .populate('tags')
            .populate('author', 'username');

        if (!post) return res.status(404).json({ message: 'Post not found' });
        res.json(post);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
