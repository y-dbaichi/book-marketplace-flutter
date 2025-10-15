/**
 * Test Setup and Utilities
 * Provides database setup, teardown, and helper functions for testing
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

let mongoServer;

// Setup MongoDB Memory Server before all tests
const setupTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri);

  console.log('📦 Test database connected');
};

// Clear all collections after each test
const clearTestDB = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
};

// Close database connection after all tests
const closeTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();

  console.log('✅ Test database closed');
};

// Generate test JWT token
const generateTestToken = (userId, userType = 'buyer') => {
  return jwt.sign(
    { userId: userId, userType },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '1h' }
  );
};

// Create test user data
const createTestUser = (overrides = {}) => {
  return {
    email: 'test@example.com',
    password: 'Test123!@#',
    userType: 'buyer',
    profile: {
      firstName: 'Test',
      lastName: 'User'
    },
    phone: '+1234567890',
    location: {
      coordinates: {
        latitude: 33.5731,
        longitude: -7.5898
      },
      name: 'Test Location',
      address: 'Test Address, City'
    },
    ...overrides
  };
};

// Create test book data
const createTestBook = (sellerId, overrides = {}) => {
  return {
    title: 'Test Book',
    author: 'Test Author',
    quality: 'good',
    quantity: 5,
    price: 100,
    description: 'Test book description',
    category: 'Fiction',
    seller: sellerId,
    status: 'available',
    condition: {
      hasWriting: false,
      hasHighlighting: false,
      hasDamage: false
    },
    ...overrides
  };
};

// Create test order data
const createTestOrder = (buyerId, sellerId, bookId, overrides = {}) => {
  return {
    buyer: buyerId,
    seller: sellerId,
    book: bookId,
    quantity: 1,
    totalPrice: 100,
    status: 'pending',
    buyerLocation: {
      type: 'Point',
      coordinates: [-7.5898, 33.5731],
      name: 'Buyer Location',
      address: 'Test Delivery Address'
    },
    sellerLocation: {
      type: 'Point',
      coordinates: [-7.5898, 33.5731],
      name: 'Seller Location',
      address: 'Test Seller Address'
    },
    ...overrides
  };
};

// Wait helper
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
  setupTestDB,
  clearTestDB,
  closeTestDB,
  generateTestToken,
  createTestUser,
  createTestBook,
  createTestOrder,
  wait
};
