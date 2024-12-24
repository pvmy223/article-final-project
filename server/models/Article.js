const mongoose = require('mongoose');

const ArticleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    abstract: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
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
        enum: ['draft', 'published', 'rejected'],
        default: 'draft'
    },
    rejectReason: {
        type: String
    },
    isPremium: {
        type: Boolean,
        default: false
    },
    viewCount: {
        type: Number,
        default: 0
    },
    featuredImage: {
        type: String,
        default: 'https://github.com/pvmy223/article-final-project/blob/c93dbff6b18d78d575c5dbac9aefb80c9d45cc58/server/uploads/articles/1734618406764-520419827.png'
        
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    reviewFeedback: {
        type: String,
        default: ''
    },
    publishDate: {
        type: Date
    }
}, { timestamps: true });

// Full-text search index
ArticleSchema.index({
  title: "text",
  abstract: "text",
  content: "text",
});

module.exports = mongoose.model('Article', ArticleSchema);