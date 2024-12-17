const Tag = require('../models/tagModel');
const Article = require('../models/articleModel');

exports.createTag = async (req, res) => {
  try {
    const { name } = req.body;

    // Check if tag already exists
    const existingTag = await Tag.findOne({ name });
    if (existingTag) {
      return res.status(400).json({ 
        message: 'Tag already exists' 
      });
    }

    const tag = new Tag({ name });
    await tag.save();

    res.status(201).json({
      message: 'Tag created successfully',
      tag
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Tag creation failed', 
      error: error.message 
    });
  }
};

exports.listTags = async (req, res) => {
  try {
    // Get tags with article count
    const tags = await Tag.aggregate([
      { $lookup: {
          from: 'articles',
          localField: '_id',
          foreignField: 'tags',
          as: 'articles'
      }},
      { $project: {
          name: 1,
          articleCount: { $size: '$articles' }
      }},
      { $sort: { articleCount: -1 } }
    ]);

    res.json(tags);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to retrieve tags', 
      error: error.message 
    });
  }
};

exports.getTagArticles = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Find articles with this tag
    const articles = await Article.find({
      tags: id,
      status: 'published'
    })
    .populate('category')
    .populate('tags')
    .skip((page - 1) * limit)
    .limit(Number(limit));

    // Count total articles
    const total = await Article.countDocuments({
      tags: id,
      status: 'published'
    });

    res.json({
      articles,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to retrieve articles', 
      error: error.message 
    });
  }
};