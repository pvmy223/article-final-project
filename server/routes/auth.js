const router = require('express').Router();
const passport = require('passport');
const authController = require('../controllers/authController');

// Register
router.post('/register', authController.register);

// Login
router.post('/login', authController.login);

// Google OAuth routes
router.get('/google', 
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        prompt: 'select_account'
    })
);

router.get('/google/callback', 
    passport.authenticate('google', { 
        failureRedirect: '/login',
        failureMessage: true
    }), 
    (req, res, next) => {
        if (req.user.error) {
            return res.redirect('/login?error=' + encodeURIComponent(req.user.error));
        }
        next();
    },
    authController.googleCallback
);

module.exports = router;