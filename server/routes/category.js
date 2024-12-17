const router = require('express').Router();
const Category = require('../models/Category');
const categoryController = require('../controllers/categoryController');

// Create a new category
router.post('/create', categoryController.createCategory);

// Get all categories
router.get('/getcategories', categoryController.listCategories);

// Get articles by category
router.get('/:id', categoryController.getCategoryArticles);



module.exports = router;
