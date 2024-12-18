const { prioritizePremiumContent } = require('../middlewares/checkSubscription');
const Article = require('../models/Article');
const Category = require('../models/Category');
const Tag = require('../models/Tag');


exports.createArticle = async (req, res) => {
  try {
    const { 
      title, 
      abstract, 
      content, 
      category, 
      tags = [], 
      featuredImage,
      isPremium = false
    } = req.body;

    // Validate category and tags
    await Category.findById(category);
    const validatedTags = await Tag.find({ 
      _id: { $in: tags } 
    });

    // Create article
    const article = new Article({
      title,
      abstract,
      content,
      category,
      tags: validatedTags.map(tag => tag._id),
      author: req.user._id,
      featuredImage,
      isPremium,
      status: 'draft'
    });

    await article.save();

    res.status(201).json({
      message: 'Article created successfully',
      article
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Article creation failed', 
      error: error.message 
    });
  }
};

exports.searchArticles = async (req, res) => {
  try {
    const { 
      query, 
      page = 1, 
      limit = 10, 
      category, 
      tag 
    } = req.query;

    // Build search query
    const searchQuery = {
      status: 'published',
      $text: { $search: query }
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
      .populate('category')
      .populate('tags')
      .populate('author', 'username')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Count total matching articles
    const total = await Article.countDocuments(modifiedQuery);

    res.json({
      articles,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page)
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Search failed', 
      error: error.message 
    });
  }
};

exports.getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate('category')
      .populate('tags')
      .populate('author', 'username');

    if (!article) {
      return res.status(404).json({ 
        message: 'Article not found' 
      });
    }

    // Increment view count
    article.viewCount += 1;
    await article.save();

    res.json(article);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to retrieve article', 
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
        _id: { $in: updateData.tags } 
      });
    }

    // Update article
    const article = await Article.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    if (!article) {
      return res.status(404).json({ 
        message: 'Article not found' 
      });
    }

    res.json({
      message: 'Article updated successfully',
      article
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Article update failed', 
      error: error.message 
    });
  }
};

exports.getTopArticles = async (req, res) => {
  try {
    // Most viewed articles
    const mostViewed = await Article.find({ status: 'published' })
      .sort({ viewCount: -1 })
      .limit(10)
      .populate('category');

    // Most recent articles
    const mostRecent = await Article.find({ status: 'published' })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('category');

    // Top articles by category
    const topByCategory = await Category.aggregate([
      { $lookup: {
          from: 'articles',
          localField: '_id',
          foreignField: 'category',
          as: 'articles'
      }},
      { $unwind: '$articles' },
      { $match: { 'articles.status': 'published' } },
      { $sort: { 'articles.createdAt': -1 } },
      { $group: {
          _id: '$_id',
          categoryName: { $first: '$name' },
          latestArticle: { $first: '$articles' }
      }},
      { $limit: 10 }
    ]);

    res.json({
      mostViewed,
      mostRecent,
      topByCategory
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to retrieve top articles', 
      error: error.message 
    });
  }
};