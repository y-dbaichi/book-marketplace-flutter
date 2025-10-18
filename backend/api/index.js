const mongoose = require('mongoose');

// Import the Express app
const app = require('../server');

// Global MongoDB connection promise to reuse across function invocations
let cachedConnection = null;

/**
 * Connect to MongoDB with connection caching for serverless
 */
const connectToDatabase = async () => {
  // Return cached connection if available and connected
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('✅ Using cached MongoDB connection');
    return cachedConnection;
  }

  try {
    console.log('🔄 Establishing new MongoDB connection...');

    cachedConnection = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout for serverless
      maxPoolSize: 10, // Limit connection pool for serverless
    });

    console.log('✅ Connected to MongoDB Atlas');
    console.log('📚 Database: bookmarketplace');

    return cachedConnection;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
};

// Vercel serverless function handler
module.exports = async (req, res) => {
  try {
    // Ensure MongoDB is connected before handling the request
    await connectToDatabase();

    // Pass request to Express app
    return app(req, res);
  } catch (error) {
    console.error('❌ Serverless function error:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
