const Category = require('../models/Category');
const Article = require('../models/Article');
const slugify = require("slugify");

exports.createCategory = async (req, res) => {
    try {
      const { name, parent, description } = req.body;
  
      // Check if parent category exists if specified
      if (parent) {
        await Category.findById(parent);
      }
  
      // Generate slug
      const slug = slugify(name, {
        lower: true,
        strict: true,
        locale: 'vi'
      });
  
      // Check if slug already exists
      const existingCategory = await Category.findOne({ slug });
      if (existingCategory) {
        return res.status(400).json({
          message: 'Category with similar name already exists'
        });
      }
  
      const category = new Category({
        name,
        parent,
        description,
        slug
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
        // Get all categories with populated parent field
        const categories = await Category.find()
            .populate('parent')
            .lean();
        // Build category map with proper IDs
        const categoryMap = new Map();
        categories.forEach(category => {
            categoryMap.set(category._id.toString(), {
                _id: category._id,
                name: category.name,
                description: category.description,
                parent: category.parent?._id?.toString(),
                children: []
            });
        });
        // Build hierarchy correctly
        const rootCategories = [];
        categories.forEach(category => {
            const categoryId = category._id.toString();
            const parentId = category.parent?._id?.toString();

            if (parentId && categoryMap.has(parentId)) {
                const parent = categoryMap.get(parentId);
                parent.children.push(categoryMap.get(categoryId));
            } else {
                rootCategories.push(categoryMap.get(categoryId));
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

exports.getArticlesByCategorySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const { page = 1, sort = 'newest', limit = 10 } = req.query;
        
        const category = await Category.findOne({ slug });
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        const sortQuery = sort === 'newest' ? { createdAt: -1 } : { viewCount: -1 };

        const articles = await Article.find({ 
            category: category._id,
            status: 'published'
        })
        .populate('category', 'name slug')
        .populate('author', 'username')
        .sort(sortQuery)
        .skip((page - 1) * limit)
        .limit(Number(limit));

        const total = await Article.countDocuments({ 
            category: category._id,
            status: 'published'
        });

        res.json({
            category,
            articles,
            pagination: {
                page: Number(page),
                totalPages: Math.ceil(total / limit),
                total
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
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

exports.getFeaturedArticlesByCategory = async (req, res) => {
    try {
        const { slug } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;

        // Find category and its subcategories
        const category = await Category.findOne({ slug });
        if (!category) {
            return res.status(404).json({
                message: 'Category not found'
            });
        }

        const childCategories = await Category.find({ parent: category._id });
        const categoryIds = [category._id, ...childCategories.map(cat => cat._id)];

        // Find featured articles
        const featuredArticles = await Article.find({
            category: { $in: categoryIds },
            status: 'published',
            isFeatured: true
        })
        .populate('category', 'name slug')
        .populate('author', 'username')
        .select('title abstract slug featuredImage createdAt viewCount category author tags')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

        // Get total count
        const total = await Article.countDocuments({
            category: { $in: categoryIds },
            status: 'published',
            isFeatured: true
        });

        res.json({
            category: {
                name: category.name,
                slug: category.slug,
                description: category.description
            },
            articles: featuredArticles,
            pagination: {
                total,
                page,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch featured articles',
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