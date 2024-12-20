const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { authorizeEditor } = require('../middlewares/authorizeRoles');
const articleController = require('../controllers/articleController');


// Specific routes first
router.get('/my-articles', authenticate, articleController.getMyArticles);
router.get('/search', articleController.searchArticles);
router.get('/top', articleController.getTopArticles);
router.get('/pending', authenticate, authorizeEditor, articleController.getPendingArticles);

// Generic CRUD routes last
router.post('/create', authenticate, articleController.createArticle);
router.get('/:id', articleController.getArticleById);
router.put('/review/:id', authenticate, authorizeEditor, articleController.reviewArticle);
router.put('/:id', authenticate, articleController.updateArticle);
router.delete('/:id', authenticate, articleController.deleteArticle);

module.exports = router;