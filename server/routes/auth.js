const router = require('express').Router();
const passport = require('passport');
const authMiddleware = require('../middlewares/authMiddleware');
const authController = require('../controllers/authController');

// Register
router.post('/register', authController.register);

// Login
router.post('/login', authController.login);

// Google OAuth routes
router.get('/google', 
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        prompt: 'select_account'  // Force account selection
    })
);

router.get('/google/callback', 
    passport.authenticate('google', { 
        failureRedirect: '/login',
        failureMessage: true
    }), 
    (req, res, next) => {
        // Handle potential errors before controller
        if (req.user.error) {
            return res.redirect('/login?error=' + encodeURIComponent(req.user.error));
        }
        next();
    },
    authController.googleCallback
);
// // Get user by token
// router.get('/user', authMiddleware.authenticate, authController.getUserByToken);

// // Update user by token
// router.put('/user', authMiddleware.authenticate, authController.updateUserByToken);

// Change password
router.put('/user/password', authMiddleware.authenticate, authController.changePassword);

// Delete user by token
router.delete('/user', authMiddleware.authenticate, authController.deleteUserByToken);

// Get all users
router.get('/users', authMiddleware.authenticate, authController.getAllUsers);

// Get user by ID
router.get('/users/:id', authMiddleware.authenticate, authController.getUserById);

// Update user by ID
router.put('/users/:id', authMiddleware.authenticate, authController.updateUserById);

// Delete user by ID
router.delete('/users/:id', authMiddleware.authenticate, authController.deleteUserById);



module.exports = router;
