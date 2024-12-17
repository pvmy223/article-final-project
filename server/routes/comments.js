const router = require('express').Router();
const Post = require('../models/Article');
const { verifyToken } = require('../middlewares/authMiddleware');

// Đăng bình luận mới
router.post('/:postId', verifyToken, async (req, res) => {
    try {
        const { content } = req.body;

        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const newComment = {
            user: req.user.id,
            content
        };

        post.comments.push(newComment);
        await post.save();

        res.status(201).json({ message: 'Comment added successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
