// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    // Check if Authorization header exists
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Extract and verify token
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user with the token
    const user = await User.findOne({ 
      _id: decoded.id,
      // Optionally, check token validity if implementing token rotation
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Attach user and token to request object
    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      message: 'Authentication failed',
      error: error.message 
    });
  }
};

module.exports = { authenticate };