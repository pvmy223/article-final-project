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