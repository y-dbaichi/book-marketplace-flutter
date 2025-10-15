const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @route   POST /api/auth/register
// @desc    Register new user (buyer or seller)
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      userType,
      phone,
      location,
      profile
    } = req.body;

    // Validation
    if (!email || !password || !userType || !phone || !location) {
      return res.status(400).json({
        message: 'Please provide all required fields: email, password, userType, phone, location'
      });
    }

    if (!['buyer', 'seller'].includes(userType)) {
      return res.status(400).json({
        message: 'userType must be either "buyer" or "seller"'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email already exists'
      });
    }

    // Validate location data
    if (!location.name || !location.coordinates || !location.address) {
      return res.status(400).json({
        message: 'Location must include name, coordinates, and address'
      });
    }

    if (!location.coordinates.latitude || !location.coordinates.longitude) {
      return res.status(400).json({
        message: 'Location coordinates must include latitude and longitude'
      });
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      userType,
      phone,
      location,
      profile: profile || {}
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        userType: user.userType,
        phone: user.phone,
        location: user.location,
        profile: user.profile
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        message: 'Please provide email and password'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        userType: user.userType,
        phone: user.phone,
        location: user.location,
        profile: user.profile,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        userType: req.user.userType,
        phone: req.user.phone,
        location: req.user.location,
        profile: req.user.profile,
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      message: 'Server error getting profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { phone, location, profile } = req.body;
    const user = req.user;

    // Validate location if provided
    if (location) {
      if (location.coordinates) {
        const { latitude, longitude } = location.coordinates;
        if (latitude !== undefined && (latitude < -90 || latitude > 90)) {
          return res.status(400).json({
            message: 'Latitude must be between -90 and 90'
          });
        }
        if (longitude !== undefined && (longitude < -180 || longitude > 180)) {
          return res.status(400).json({
            message: 'Longitude must be between -180 and 180'
          });
        }
      }
    }

    // Update fields if provided
    if (phone) user.phone = phone;
    if (location) user.location = location;
    if (profile) user.profile = { ...user.profile, ...profile };

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        userType: user.userType,
        phone: user.phone,
        location: user.location,
        profile: user.profile
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      message: 'Server error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', auth, async (req, res) => {
  try {
    // Generate new token for authenticated user
    const token = generateToken(req.user._id);

    res.json({
      message: 'Token refreshed successfully',
      token,
      user: {
        id: req.user._id,
        email: req.user.email,
        userType: req.user.userType,
        phone: req.user.phone,
        location: req.user.location,
        profile: req.user.profile
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      message: 'Server error refreshing token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Public (optional auth)
router.post('/logout', (req, res) => {
  // Since JWT is stateless, logout is handled client-side by removing the token
  // This endpoint provides a standardized API response
  res.json({
    message: 'Logout successful'
  });
});

module.exports = router;
