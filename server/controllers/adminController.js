const Article = require('../models/Article');
const User = require('../models/User');

exports.getDashboardStats = async (req, res) => {
    try {
        const [totalArticles, totalUsers, newUsers] = await Promise.all([
            Article.countDocuments(),
            User.countDocuments(),
            User.countDocuments({
                createdAt: { 
                    $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
                }
            })
        ]);

        res.json({
            totalArticles,
            totalUsers,
            newUsers
        });
    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch dashboard stats',
            error: error.message
        });
    }
};

exports.getRecentActivity = async (req, res) => {
    try {
        const recentArticles = await Article.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('author', 'username')
            .lean();

        const activities = recentArticles.map(article => ({
            action: `New article: ${article.title}`,
            user: article.author.username,
            timestamp: article.createdAt
        }));

        res.json(activities);
    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch recent activity',
            error: error.message
        });
    }
};