const router = require('express').Router();
const authorizeRoles = require('../middlewares/authorizeRoles');
const authMiddleware = require('../middlewares/authMiddleware');
const userController = require('../controllers/userController');

// Get all users
router.get('/', authMiddleware.authenticate, authorizeRoles.authorizeAdmin, userController.getAllUsers);3

// Get all editors
router.get('/editors', authMiddleware.authenticate, authorizeRoles.authorizeAdmin, userController.getAllEditors);

// Get user by ID
router.get('/:id', authMiddleware.authenticate, userController.getUserById);

// Change user role
router.put('/:id/role', authMiddleware.authenticate, authorizeRoles.authorizeAdmin, userController.changeUserRole);

// Update user by ID
router.put('/:id', authMiddleware.authenticate, userController.updateUserById);

// Delete user by ID
router.delete('/:id', authMiddleware.authenticate, userController.deleteUserById);

// Assign categories to editor
router.put('/:id/assign-categories', authMiddleware.authenticate, userController.assignCategories);

// Change password
router.put('/password', authMiddleware.authenticate, userController.changePassword);

module.exports = router;