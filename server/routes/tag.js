const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');
const { authenticate } = require('../middlewares/authMiddleware');

// Protected routes
router.use(authenticate);

router.post('/create', tagController.createTag);
router.get('/gettags', tagController.listTags);
router.put('/:id', tagController.updateTag); // Add update route
router.delete('/:id', tagController.deleteTag); // Add delete route
router.get('/:id/articles', tagController.getTagArticles);

module.exports = router;