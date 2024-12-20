const router = require('express').Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { authorizeAdmin } = require('../middlewares/authorizeRoles');
const adminController = require('../controllers/adminController');

router.get('/stats', authenticate, authorizeAdmin, adminController.getDashboardStats);
router.get('/activity', authenticate, authorizeAdmin, adminController.getRecentActivity);

module.exports = router;