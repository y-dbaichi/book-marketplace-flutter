// Jest setup file - runs before all tests
// Set test environment variables

process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test'; // Will be overridden by MongoMemoryServer
