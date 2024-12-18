const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const articleController = require('../controllers/articleController');

// Create a new article
router.post('/create', authenticate, articleController.createArticle);

// Search articles
router.get('/search', articleController.searchArticles);

// Get top articles (most viewed, most recent, top by category)
router.get('/top', articleController.getTopArticles);

// Get an article by ID
router.get('/:id', articleController.getArticleById);

// Update an article by ID
router.put('/:id', authenticate, articleController.updateArticle);

module.exports = router;