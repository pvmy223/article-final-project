const Tag = require('../models/Tag');
const Article = require('../models/Article');

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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Find tag first
        const tag = await Tag.findById(id);
        if (!tag) {
            return res.status(404).json({
                message: 'Tag not found'
            });
        }

        // Get total articles count
        const totalArticles = await Article.countDocuments({ tags: id });
        const totalPages = Math.ceil(totalArticles / limit);

        // Get articles with pagination
        const articles = await Article.find({ tags: id })
            .populate('author', 'username')
            .populate('category', 'name')
            .select('title abstract createdAt status viewCount')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            tagName: tag.name,
            articles,
            currentPage: page,
            totalPages,
            totalArticles
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to retrieve tag articles',
            error: error.message
        });
    }
};

exports.updateTag = async (req, res) => {
  try {
      const { id } = req.params;
      const { name } = req.body;

      // Check if new name already exists
      const existingTag = await Tag.findOne({ 
          name, 
          _id: { $ne: id } 
      });
      
      if (existingTag) {
          return res.status(400).json({ 
              message: 'Tag name already exists' 
          });
      }

      const updatedTag = await Tag.findByIdAndUpdate(
          id,
          { name },
          { new: true }
      );

      if (!updatedTag) {
          return res.status(404).json({ 
              message: 'Tag not found' 
          });
      }

      res.json({
          message: 'Tag updated successfully',
          tag: updatedTag
      });
  } catch (error) {
      res.status(500).json({ 
          message: 'Failed to update tag',
          error: error.message 
      });
  }
};

exports.deleteTag = async (req, res) => {
  try {
      const { id } = req.params;

      // Check if tag is used in articles
      const hasArticles = await Article.exists({ tags: id });
      if (hasArticles) {
          return res.status(400).json({
              message: 'Cannot delete tag that is used in articles'
          });
      }

      const deletedTag = await Tag.findByIdAndDelete(id);
      if (!deletedTag) {
          return res.status(404).json({
              message: 'Tag not found'
          });
      }

      res.json({
          message: 'Tag deleted successfully',
          tag: deletedTag
      });
  } catch (error) {
      res.status(500).json({
          message: 'Failed to delete tag',
          error: error.message
      });
  }
};