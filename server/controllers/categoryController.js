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

exports.getAllCategoriesWithSubs = async (req, res) => {
  try {
      // Get all categories
      const categories = await Category.find({}).lean();
      
      // Build category map
      const categoryMap = new Map();
      categories.forEach(category => {
          categoryMap.set(category._id.toString(), {
              ...category,
              children: []
          });
      });

      // Build hierarchy
      const rootCategories = [];
      categories.forEach(category => {
          if (category.parent) {
              const parentCategory = categoryMap.get(category.parent.toString());
              if (parentCategory) {
                  parentCategory.children.push(categoryMap.get(category._id.toString()));
              }
          } else {
              rootCategories.push(categoryMap.get(category._id.toString()));
          }
      });

      res.json(rootCategories);
  } catch (error) {
      console.error('Category fetch error:', error);
      res.status(500).json({
          message: 'Failed to retrieve categories',
          error: error.message
      });
  }
};

exports.getPublicCategoriesWithSubs = async (req, res) => {
    try {
        // Get all categories without authentication requirement
        const categories = await Category.find({})
            .select('name description parent')
            .lean();
        
        // Build category map
        const categoryMap = new Map();
        categories.forEach(category => {
            categoryMap.set(category._id.toString(), {
                ...category,
                children: []
            });
        });

        // Build hierarchy
        const rootCategories = [];
        categories.forEach(category => {
            if (category.parent) {
                const parentCategory = categoryMap.get(category.parent.toString());
                if (parentCategory) {
                    parentCategory.children.push(categoryMap.get(category._id.toString()));
                }
            } else {
                rootCategories.push(categoryMap.get(category._id.toString()));
            }
        });

        res.json(rootCategories);
    } catch (error) {
        console.error('Public category fetch error:', error);
        res.status(500).json({
            message: 'Failed to retrieve categories',
            error: error.message
        });
    }
};

exports.getCategoryArticles = async (req, res) => {
  try {
      const { id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const articles = await Article.find({ category: id })
          .populate('author', 'username email')
          .populate('category', 'name')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);

      const totalArticles = await Article.countDocuments({ category: id });

      res.json({
          articles,
          currentPage: page,
          totalPages: Math.ceil(totalArticles / limit),
          totalArticles
      });
  } catch (error) {
      res.status(500).json({
          message: 'Failed to fetch category articles',
          error: error.message
      });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
      const { id } = req.params;

      // Check for subcategories
      const hasSubcategories = await Category.exists({ parent: id });
      if (hasSubcategories) {
          return res.status(400).json({
              message: 'Cannot delete category with subcategories'
          });
      }

      // Check for articles
      const hasArticles = await Article.exists({ category: id });
      if (hasArticles) {
          return res.status(400).json({
              message: 'Cannot delete category with articles'
          });
      }

      const deletedCategory = await Category.findByIdAndDelete(id);
      if (!deletedCategory) {
          return res.status(404).json({
              message: 'Category not found'
          });
      }

      res.json({
          message: 'Category deleted successfully',
          category: deletedCategory
      });
  } catch (error) {
      res.status(500).json({
          message: 'Failed to delete category',
          error: error.message
      });
  }
};

exports.updateCategory = async (req, res) => {
  try {
      const { id } = req.params;
      const { name, parent, description } = req.body;

      // Validate parent if provided
      if (parent) {
          await Category.findById(parent);
      }

      const updatedCategory = await Category.findByIdAndUpdate(
          id,
          { name, parent, description },
          { new: true }
      );

      if (!updatedCategory) {
          return res.status(404).json({
              message: 'Category not found'
          });
      }

      res.json({
          message: 'Category updated successfully',
          category: updatedCategory
      });
  } catch (error) {
      res.status(500).json({
          message: 'Failed to update category',
          error: error.message
      });
  }
};