const { User } = require('../models/User');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../middlewares/authMiddleware');

exports.register = async (req, res) => {
  try {
    const { username, email, password, role = 'guest' } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role
    });

    await user.save();

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Registration failed', 
      error: error.message 
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid credentials' 
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ 
        message: 'Invalid credentials' 
      });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Login failed', 
      error: error.message 
    });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    // Exclude sensitive information
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('managedCategories');

    res.json(user);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to retrieve profile', 
      error: error.message 
    });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const updates = req.body;
    const user = req.user;

    // Prevent role modification
    delete updates.role;

    // Update password separately
    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      user._id, 
      updates, 
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Profile update failed', 
      error: error.message 
    });
  }
};

exports.subscribeUser = async (req, res) => {
  try {
    const { duration = 7 } = req.body;
    const user = req.user;

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + duration);

    // Update user subscription
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        role: 'subscriber',
        subscriberExpiryDate: expiryDate
      },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Subscription activated successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Subscription failed', 
      error: error.message 
    });
  }
};