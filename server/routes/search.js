const express = require('express');
const router = express.Router();
const searchController = require('../controllers/articleController');

// Tìm kiếm bài viết
router.get('/', searchController.searchArticles);

module.exports = router;