const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { username, email, password, role = 'guest' } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      // If user exists and has no password (Google user)
      if (!existingUser.password && password) {
        // Update existing Google user with password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        existingUser.password = hashedPassword;
        await existingUser.save();
        
        const token = jwt.sign(
          { id: existingUser._id, role: existingUser.role }, 
          process.env.JWT_SECRET, 
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        return res.json({
          message: 'Account updated successfully',
          user: {
            id: existingUser._id,
            username: existingUser.username,
            email: existingUser.email,
            role: existingUser.role
          },
          token
        });
      }
      
      return res.status(400).json({ message: 'Email already registered' });
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
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

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
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

    // Set token as a cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

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

exports.googleCallback = async (req, res) => {
  try {
      if (!req.user) {
          console.error('No user data in request');
          return res.redirect('/pages/login.html?error=no_user_data');
      }

      // Debug user profile structure
      console.log('Google user profile:', req.user);

      // Safe extraction of email and display name
      const id = req.user.id;
      const email = req.user.email; // Google now returns email directly
      const displayName = req.user.displayName || email.split('@')[0]; // Fallback to email username

      // Check for existing user
      const existingUser = await User.findOne({
          $or: [
              { email: email },
              { googleId: id }
          ]
      });

      let user;
      if (existingUser) {
          existingUser.googleId = id;
          existingUser.lastLogin = new Date();
          user = await existingUser.save();
      } else {
          let username = displayName;
          let isUnique = false;
          let attempts = 0;

          while (!isUnique && attempts < 5) {
              try {
                  const randomString = Math.random().toString(36).substring(2, 6);
                  username = attempts === 0 ? displayName : `${displayName}_${randomString}`;
                  
                  user = await User.create({
                      username: username,
                      email: email,
                      googleId: id,
                      role: 'guest',
                      lastLogin: new Date()
                  });
                  isUnique = true;
              } catch (err) {
                  if (err.code === 11000) {
                      attempts++;
                      continue;
                  }
                  throw err;
              }
          }

          if (!isUnique) {
              throw new Error('Could not generate unique username');
          }
      }

      // Debug token generation
      const token = jwt.sign(
        { 
            id: user._id, 
            role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

      console.log('Generated token:', token); // Debug log
    
      // Set cookie with specific options
      res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60 * 1000,
          sameSite: 'lax',
          path: '/'
      });
      // Debug cookie
      console.log('Cookie set:', res.getHeader('Set-Cookie'));

      // Redirect with token in URL for debugging
      return res.redirect(`http://127.0.0.1:5500/pages/auth-success.html?token=${token}`);


  } catch (error) {
      console.error('Google auth error:', error);
      return res.redirect('/pages/login.html?error=' + encodeURIComponent(error.message));
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

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = req.user;

    // Check old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Old password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Password change failed', 
      error: error.message 
    });
  }
};

exports.deleteUserByToken = async (req, res) => {
  try {
    const user = req.user;

    await User.findByIdAndDelete(user._id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      message: 'User deletion failed', 
      error: error.message 
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to retrieve users', 
      error: error.message 
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to retrieve user', 
      error: error.message 
    });
  }
};

exports.updateUserById = async (req, res) => {
  try {
    const updates = req.body;

    // Prevent role modification
    delete updates.role;

    // Update password separately
    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id, 
      updates, 
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'User update failed', 
      error: error.message 
    });
  }
};

exports.deleteUserById = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      message: 'User deletion failed', 
      error: error.message 
    });
  }
};

exports.assignCategories = async (req, res) => {
  try {
      const { id } = req.params;
      const { categories } = req.body;

      const user = await User.findById(id);
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      if (user.role !== 'editor') {
          return res.status(400).json({ message: 'User is not an editor' });
      }

      user.managedCategories = categories;
      await user.save();

      res.json({ message: 'Categories assigned successfully' });
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
};