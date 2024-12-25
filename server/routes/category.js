const router = require('express').Router();
const categoryController = require('../controllers/categoryController');
const { authenticate } = require('../middlewares/authMiddleware');

// Public routes - must be before auth middleware
router.get('/public/withsubs', categoryController.getPublicCategoriesWithSubs);
router.get('/public/:slug/articles', categoryController.getArticlesByCategorySlug);
router.get('/public/:slug/featured', categoryController.getFeaturedArticlesByCategory);

// Protected routes
router.use(authenticate);

// Admin routes
router.post('/create', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.get('/getcategories', categoryController.listCategories);
router.get('/getallwithsubs', categoryController.getAllCategoriesWithSubs);
router.delete('/delete/:id', categoryController.deleteCategory);
router.get('/:id/articles', categoryController.getCategoryArticles);

module.exports = router;