const mongoose = require('mongoose');

const ArticleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    abstract: { type: String },
    content: { type: String, required: true },
    featuredImage: { type: String },
    category: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Category', 
      required: true 
    },
    tags: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Tag' 
    }],
    author: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    status: {
      type: String,
      enum: ['draft', 'rejected', 'published', 'pending'],
      default: 'draft'
    },
    publishedAt: { type: Date },
    isPremium: { type: Boolean, default: false },
    editorNotes: { type: String },
    viewCount: { type: Number, default: 0 }
  }, { timestamps: true });
  
  // Full-text search index
  ArticleSchema.index({ 
    title: 'text', 
    abstract: 'text', 
    content: 'text' 
  });

module.exports = mongoose.model('Article', ArticleSchema);
