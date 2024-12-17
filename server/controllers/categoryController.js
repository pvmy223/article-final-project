const Category = require('../models/Category');
const Article = require('../models/Article');

exports.createCategory = async (req, res) => {
  try {
    const { name, parent, description } = req.body;

    // Check if parent category exists if specified
    if (parent) {
      await Category.findById(parent);
    }

    const category = new Category({
      name,
      parent,
      description
    });

    await category.save();

    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Category creation failed', 
      error: error.message 
    });
  }
};

exports.listCategories = async (req, res) => {
  try {
    // Fetch top-level categories with nested categories
    const categories = await Category.aggregate([
      { $match: { parent: null } },
      { $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: 'parent',
          as: 'subcategories'
      }},
      { $project: {
          name: 1,
          description: 1,
          subcategories: 1
      }}
    ]);

    res.json(categories);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to retrieve categories', 
      error: error.message 
    });
  }
};

exports.getCategoryArticles = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Find all subcategories
    const subcategories = await Category.find({ 
      $or: [
        { _id: id },
        { parent: id }
      ]
    }).select('_id');

    const subcategoryIds = subcategories.map(cat => cat._id);

    // Find articles in category and subcategories
    const articles = await Article.find({
      category: { $in: subcategoryIds },
      status: 'published'
    })
    .populate('category')
    .skip((page - 1) * limit)
    .limit(Number(limit));

    // Count total articles
    const total = await Article.countDocuments({
      category: { $in: subcategoryIds },
      status: 'published'
    });

    res.json({
      articles,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to retrieve category articles', 
      error: error.message 
    });
  }
};