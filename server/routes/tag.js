const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');

// Create a new tag
router.post('/create', tagController.createTag);

// Get all tags
router.get('/gettags', tagController.listTags);

// Get articles by tag
router.get('/:id/articles', tagController.getTagArticles);

module.exports = router;