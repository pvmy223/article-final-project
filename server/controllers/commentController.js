const Article = require('../models/Article');
const Comment = require('../models/Comment');
const { authenticate } = require('../middlewares/authMiddleware');

exports.createComment = async (req, res) => {
  try {
    const { articleId, content } = req.body;

    // Find the article
    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Create new comment
    const comment = new Comment({
      article: articleId,
      user: req.user._id,
      content
    });

    await comment.save();

    // Add comment to article
    article.comments.push(comment._id);
    await article.save();

    res.status(201).json({
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Comment creation failed', 
      error: error.message 
    });
  }
};

exports.getCommentsByArticle = async (req, res) => {
  try {
    const { articleId } = req.params;

    // Find comments for the article
    const comments = await Comment.find({ article: articleId })
      .populate('user', 'username')
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to retrieve comments', 
      error: error.message 
    });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete the comment
    const comment = await Comment.findByIdAndDelete(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Remove comment from article
    await Article.findByIdAndUpdate(comment.article, {
      $pull: { comments: comment._id }
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to delete comment', 
      error: error.message 
    });
  }
};