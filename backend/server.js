const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import custom middleware
const requestLogger = require('./middleware/requestLogger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet helps secure Express apps by setting HTTP headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API
  crossOriginEmbedderPolicy: false // Allow embedding
}));

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all routes
app.use('/api/', limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: 'Too many authentication attempts, please try again later'
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ============================================
// GENERAL MIDDLEWARE
// ============================================

// CORS configuration - Allow requests from anywhere
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression middleware - compress responses
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

// ============================================
// API ROUTES
// ============================================

app.use('/api/auth', require('./routes/auth'));
app.use('/api/books', require('./routes/books'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/geojson', require('./routes/geojson'));

// ============================================
// HEALTH CHECK
// ============================================

/**
 * Health check endpoint
 * @route GET /api/health
 * @access Public
 */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Book Marketplace API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler - must be AFTER all routes
app.use(notFoundHandler);

// Global error handler - must be LAST
app.use(errorHandler);

// ============================================
// DATABASE CONNECTION (for local development only)
// ============================================

/**
 * Connect to MongoDB with retry logic
 * NOTE: In Vercel serverless, connection is handled by api/index.js
 */
const connectDB = async () => {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        // Mongoose 6+ doesn't need these options anymore
        // useNewUrlParser and useUnifiedTopology are deprecated
      });

      console.log('✅ Connected to MongoDB Atlas');
      console.log('📚 Database: bookmarketplace');
      break;
    } catch (error) {
      retries++;
      console.error(`❌ MongoDB connection attempt ${retries}/${maxRetries} failed:`, error.message);

      if (retries === maxRetries) {
        console.error('❌ Could not connect to MongoDB. Exiting...');
        process.exit(1);
      }

      // Wait before retrying (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, retries), 10000);
      console.log(`⏳ Retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

// ============================================
// SERVER STARTUP (local development only)
// ============================================

/**
 * Start the Express server
 * NOTE: This only runs locally. Vercel handles server startup automatically.
 */
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start server
    const PORT = process.env.PORT || 5001;
    const server = app.listen(PORT, () => {
      console.log('');
      console.log('═══════════════════════════════════════════');
      console.log('🚀 Book Marketplace API Server');
      console.log('═══════════════════════════════════════════');
      console.log(`📡 Server: http://localhost:${PORT}`);
      console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('═══════════════════════════════════════════');
      console.log('');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('⚠️  SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('✅ HTTP server closed');
        mongoose.connection.close(false, () => {
          console.log('✅ MongoDB connection closed');
          process.exit(0);
        });
      });
    });

    process.on('SIGINT', () => {
      console.log('⚠️  SIGINT signal received: closing HTTP server');
      server.close(() => {
        console.log('✅ HTTP server closed');
        mongoose.connection.close(false, () => {
          console.log('✅ MongoDB connection closed');
          process.exit(0);
        });
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server ONLY when run directly (local development)
// When imported by Vercel, this won't execute
if (require.main === module) {
  startServer();
}

// Export the Express app for Vercel serverless
module.exports = app;
