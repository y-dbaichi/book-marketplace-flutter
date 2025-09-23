const jwt = require('jsonwebtoken');
const User = require('../models/User');
const admin = require('firebase-admin');

// Ensure Firebase Admin is initialized only once
if (!admin.apps.length) {
  const serviceAccount = require('../firebaseAdmin'); // Adjust path if needed
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided, access denied' });
    }
    const token = authHeader.replace('Bearer ', '').trim();
    let user;
    let jwtError, firebaseError;
    // Try JWT first
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      user = await User.findById(decoded.userId).select('-password');
    } catch (err) {
      jwtError = err;
      // Try Firebase ID token
      try {
        const firebaseUser = await admin.auth().verifyIdToken(token);
        user = await User.findOne({ email: firebaseUser.email }).select('-password');
      } catch (err2) {
        firebaseError = err2;
      }
    }
    if (!user) {
      console.error('Auth failed:', { jwtError, firebaseError });
      return res.status(401).json({ message: 'Token is not valid' });
    }
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Optional auth middleware - sets req.user if token is valid, but doesn't require it
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return next(); // No token, continue without setting user
    }
    const token = authHeader.replace('Bearer ', '').trim();
    let user;
    let jwtError, firebaseError;
    // Try JWT first
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      user = await User.findById(decoded.userId).select('-password');
    } catch (err) {
      jwtError = err;
      // Try Firebase ID token
      try {
        const firebaseUser = await admin.auth().verifyIdToken(token);
        user = await User.findOne({ email: firebaseUser.email }).select('-password');
      } catch (err2) {
        firebaseError = err2;
      }
    }
    if (user && user.isActive) {
      req.user = user;
    }
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    // Still continue even if token is invalid
    next();
  }
};

// Middleware to require buyer role
const requireBuyer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  if (req.user.userType !== 'buyer') {
    return res.status(403).json({ message: 'Access denied. Buyers only.' });
  }
  next();
};

// Middleware to require customer role
const requireCustomer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  if (req.user.userType !== 'customer') {
    return res.status(403).json({ message: 'Access denied. Customers only.' });
  }
  next();
};

module.exports = {auth, optionalAuth, requireBuyer, requireCustomer};