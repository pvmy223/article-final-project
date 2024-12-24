const User = require('../models/User');
const bcrypt = require('bcryptjs');

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

exports.getAllUsers = async (req, res) => {
  try {      
      const users = await User.find()
          .select('-password -googleId')
          .populate('managedCategories')
          .lean();
      
      return res.status(200).json(users);
      
  } catch (error) {
      console.error('Get all users error:', error);
      return res.status(500).json({
          message: 'Failed to fetch users',
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

exports.changeUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, managedCategories, subscriberExpiryDate } = req.body;

        // Validate role
        const validRoles = ["guest", "subscriber", "writer", "editor", "administrator"];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        // Find user
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prepare update data
        const updateData = { role };

        // Handle role-specific data
        if (role === 'editor' && managedCategories) {
            updateData.managedCategories = managedCategories;
        } else {
            updateData.managedCategories = [];
        }

        if (role === 'subscriber' && subscriberExpiryDate) {
            updateData.subscriberExpiryDate = subscriberExpiryDate;
        } else {
            updateData.subscriberExpiryDate = null;
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            message: 'User role updated successfully',
            user: updatedUser
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to update user role',
            error: error.message
        });
    }
};

exports.getAllEditors = async (req, res) => {
    try {      
        const editors = await User.find({ role: 'editor' })
            .select('-password -googleId')
            .populate('managedCategories')
            .lean();
        
        return res.status(200).json(editors);
        
    } catch (error) {
        console.error('Get editors error:', error);
        return res.status(500).json({
            message: 'Failed to fetch editors',
            error: error.message
        });
    }
};