const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const commentController = require('../controllers/commentController');

// Create a new comment
router.post('/create', authenticate, commentController.createComment);

// Get comments by article
router.get('/:articleId', commentController.getCommentsByArticle);

// Delete a comment by ID
router.delete('/:id', authenticate, commentController.deleteComment);

module.exports = router;