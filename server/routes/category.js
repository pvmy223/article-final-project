const router = require('express').Router();
const categoryController = require('../controllers/categoryController');
const { authenticate } = require('../middlewares/authMiddleware');

// Protected routes
router.use(authenticate);

// CRUD operations
router.post('/create', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory); // Add update route
router.get('/getcategories', categoryController.listCategories);
router.get('/getallwithsubs', categoryController.getAllCategoriesWithSubs);
router.delete('/delete/:id', categoryController.deleteCategory);
router.get('/:id/articles', categoryController.getCategoryArticles);

module.exports = router;