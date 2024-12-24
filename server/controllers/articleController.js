const {
  prioritizePremiumContent,
} = require("../middlewares/checkSubscription");
const Article = require("../models/Article");
const Category = require("../models/Category");
const Tag = require("../models/Tag");

exports.createArticle = async (req, res) => {
  try {
    const {
      title,
      abstract,
      content,
      category,
      tags = [],
      featuredImage,
      isPremium = false,
    } = req.body;

    // Validate category and tags
    await Category.findById(category);
    const validatedTags = await Tag.find({
      _id: { $in: tags },
    });

    // Create article
    const article = new Article({
      title,
      abstract,
      content,
      category,
      tags: validatedTags.map((tag) => tag._id),
      author: req.user._id,
      featuredImage,
      isPremium,
      status: "draft",
    });

    await article.save();

    res.status(201).json({
      message: "Article created successfully",
      article,
    });
  } catch (error) {
    res.status(500).json({
      message: "Article creation failed",
      error: error.message,
    });
  }
};

exports.searchArticles = async (req, res) => {
  try {
    const { query, page = 1, limit = 10, category, tag } = req.query;

    // Build search query
    const searchQuery = {
      status: "published",
      $text: { $search: query },
    };

    // Add category filter
    if (category) {
      searchQuery.category = category;
    }

    // Add tag filter
    if (tag) {
      searchQuery.tags = tag;
    }

    // Prioritize content for subscribers
    const modifiedQuery = req.user
      ? prioritizePremiumContent(searchQuery, req.user)
      : searchQuery;

    // Perform search
    const articles = await Article.find(modifiedQuery)
      .populate("category")
      .populate("tags")
      .populate("author", "username")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Count total matching articles
    const total = await Article.countDocuments(modifiedQuery);

    res.json({
      articles,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    res.status(500).json({
      message: "Search failed",
      error: error.message,
    });
  }
};
exports.getPendingArticles = async (req, res) => {
  try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Build query
      const query = { status: 'draft' };
      if (req.query.category) {
          query.category = req.query.category;
      }

      // Get articles with pagination
      const articles = await Article.find(query)
          .populate('author', 'username')
          .populate('category', 'name')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean();

      // Get total count
      const total = await Article.countDocuments(query);

      res.json({
          articles,
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          total
      });

  } catch (error) {
      console.error('Error retrieving pending articles:', error);
      res.status(500).json({ 
          message: 'Failed to retrieve articles',
          error: error.message 
      });
  }
};
exports.getMyArticles = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const skip = (page - 1) * limit;

        // Build query
        let query = { author: req.user.id };
        
        // Add status filter
        if (status) {
            query.status = status;
        }

        // Add search filter
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        const articles = await Article.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Article.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        res.json({
            articles,
            currentPage: parseInt(page),
            totalPages,
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate("category")
      .populate("tags")
      .populate("author", "username");

    if (!article) {
      return res.status(404).json({
        message: "Article not found",
      });
    }

    // Increment view count
    article.viewCount += 1;
    await article.save();

    res.json(article);
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve article",
      error: error.message,
    });
  }
};

exports.reviewArticle = async (req, res) => {
    try {
        const { id } = req.params;
        const { approved, feedback } = req.body;

        const article = await Article.findById(id);
        if (!article) {
            return res.status(404).json({ message: 'Article not found' });
        }

        if (approved) {
            article.status = 'published';
            article.publishDate = new Date();
            article.rejectReason = null;
        } else {
            if (!feedback) {
                return res.status(400).json({ message: 'Reject reason is required' });
            }
            article.status = 'rejected';
            article.rejectReason = feedback;
            article.publishDate = null;
        }

        const updatedArticle = await article.save();

        res.json({
            message: approved ? 'Article published' : 'Article rejected',
            article: updatedArticle
        });

    } catch (error) {
        console.error('Review article error:', error);
        res.status(500).json({
            message: 'Failed to review article',
            error: error.message
        });
    }
};

exports.updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate category if provided
    if (updateData.category) {
      await Category.findById(updateData.category);
    }

    // Validate tags if provided
    if (updateData.tags) {
      await Tag.find({
        _id: { $in: updateData.tags },
      });
    }

    // Update article
    const article = await Article.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!article) {
      return res.status(404).json({
        message: "Article not found",
      });
    }

    res.json({
      message: "Article updated successfully",
      article,
    });
  } catch (error) {
    res.status(500).json({
      message: "Article update failed",
      error: error.message,
    });
  }
};

exports.deleteArticle = async (req, res) => {
  try {
      const article = await Article.findOneAndDelete({
          _id: req.params.id,
          author: req.user.id
      });

      if (!article) {
          return res.status(404).json({
              message: 'Article not found or unauthorized'
          });
      }

      res.json({
          message: 'Article deleted successfully'
      });
  } catch (error) {
      res.status(500).json({
          message: 'Failed to delete article',
          error: error.message
      });
  }
};

exports.getTopArticles = async (req, res) => {
  try {
    // Most viewed articles
    const mostViewed = await Article.find({ status: "published" })
      .sort({ viewCount: -1 })
      .limit(10)
      .populate("category");

    // Most recent articles
    const mostRecent = await Article.find({ status: "published" })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("category");

    // Top articles by category
    const topByCategory = await Category.aggregate([
      {
        $lookup: {
          from: "articles",
          localField: "_id",
          foreignField: "category",
          as: "articles",
        },
      },
      { $unwind: "$articles" },
      { $match: { "articles.status": "published" } },
      { $sort: { "articles.createdAt": -1 } },
      {
        $group: {
          _id: "$_id",
          categoryName: { $first: "$name" },
          latestArticle: { $first: "$articles" },
        },
      },
      { $limit: 10 },
    ]);

    res.json({
      mostViewed,
      mostRecent,
      topByCategory,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve top articles",
      error: error.message,
    });
  }
};

exports.getAllArticles = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build query based on filters
        const query = {};
        if (req.query.status) query.status = req.query.status;
        if (req.query.category) query.category = req.query.category;
        if (req.query.search) {
            query.$or = [
                { title: { $regex: req.query.search, $options: 'i' } },
                { content: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        const articles = await Article.find(query)
            .populate('author', 'username')
            .populate('category', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Article.countDocuments(query);

        res.json({
            articles,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({
            message: 'Failed to retrieve articles',
            error: error.message
        });
    }
};
