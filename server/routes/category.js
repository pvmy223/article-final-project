const router = require('express').Router();
const Category = require('../models/Category');

// Lấy danh sách tất cả chuyên mục
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find().populate('parentCategory');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Tạo chuyên mục mới (admin)
router.post('/', async (req, res) => {
    try {
        const { name, parentCategory } = req.body;

        const newCategory = new Category({
            name,
            slug: name.toLowerCase().replace(/ /g, '-'),
            parentCategory
        });

        await newCategory.save();
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
