/**
 * Unit Tests for Auth Middleware
 * Tests authentication, authorization, and role-based access control
 */

const jwt = require('jsonwebtoken');
const { auth, requireSeller, requireBuyer, optionalAuth } = require('../../../middleware/auth');
const User = require('../../../models/User');
const { setupTestDB, clearTestDB, closeTestDB, createTestUser, generateTestToken } = require('../../setup');

// Mock request and response objects
const mockRequest = (token = null, userId = null, userType = null) => ({
  header: jest.fn((name) => {
    if (name === 'Authorization' && token) {
      return `Bearer ${token}`;
    }
    return null;
  }),
  user: userId ? { userId, userType } : null
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('Auth Middleware Unit Tests', () => {
  let testUser;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    jest.clearAllMocks();

    // Create test user
    testUser = await User.create(createTestUser({
      email: 'test@test.com',
      userType: 'buyer'
    }));
  });

  describe('auth middleware', () => {
    test('should authenticate valid token', async () => {
      const token = generateTestToken(testUser._id, 'buyer');
      const req = mockRequest(token);
      const res = mockResponse();

      await auth(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(testUser._id.toString());
      expect(req.user.userType).toBe('buyer');
    });

    test('should fail without token', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await auth(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No token provided, access denied'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should fail with invalid token format', async () => {
      const req = mockRequest('invalid-token');
      const res = mockResponse();

      await auth(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Token is not valid'
      });
    });

    test('should fail with malformed JWT', async () => {
      const req = {
        header: jest.fn(() => 'Bearer malformed.jwt.token')
      };
      const res = mockResponse();

      await auth(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Token is not valid'
      });
    });

    test('should fail with expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: testUser._id, userType: 'buyer' },
        process.env.JWT_SECRET || 'test-secret-key',
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const req = mockRequest(expiredToken);
      const res = mockResponse();

      await auth(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Token is not valid'
      });
    });

    test('should fail with non-existent user', async () => {
      const fakeUserId = '507f1f77bcf86cd799439011';
      const token = generateTestToken(fakeUserId, 'buyer');
      const req = mockRequest(token);
      const res = mockResponse();

      await auth(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Token is not valid'
      });
    });

    test('should extract user from token correctly', async () => {
      const token = generateTestToken(testUser._id, 'buyer');
      const req = mockRequest(token);
      const res = mockResponse();

      await auth(req, res, mockNext);

      expect(req.user._id.toString()).toBe(testUser._id.toString());
      expect(req.user.userType).toBe('buyer');
    });
  });

  describe('requireSeller middleware', () => {
    test('should allow seller to proceed', () => {
      const req = mockRequest(null, testUser._id, 'seller');
      const res = mockResponse();

      requireSeller(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should block buyer', () => {
      const req = mockRequest(null, testUser._id, 'buyer');
      const res = mockResponse();

      requireSeller(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Access denied. Sellers only.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should fail without user object', () => {
      const req = mockRequest();
      const res = mockResponse();

      requireSeller(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Authentication required.'
      });
    });
  });

  describe('requireBuyer middleware', () => {
    test('should allow buyer to proceed', () => {
      const req = mockRequest(null, testUser._id, 'buyer');
      const res = mockResponse();

      requireBuyer(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should block seller', () => {
      const req = mockRequest(null, testUser._id, 'seller');
      const res = mockResponse();

      requireBuyer(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Access denied. Buyers only.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should fail without user object', () => {
      const req = mockRequest();
      const res = mockResponse();

      requireBuyer(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Authentication required.'
      });
    });
  });

  describe('optionalAuth middleware', () => {
    test('should authenticate valid token', async () => {
      const token = generateTestToken(testUser._id, 'buyer');
      const req = mockRequest(token);
      const res = mockResponse();

      await optionalAuth(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(testUser._id.toString());
    });

    test('should proceed without token', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await optionalAuth(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(req.user).toBeFalsy();
    });

    test('should proceed with invalid token', async () => {
      const req = mockRequest('invalid-token');
      const res = mockResponse();

      await optionalAuth(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(req.user).toBeFalsy();
    });

    test('should not throw error for malformed token', async () => {
      const req = {
        header: jest.fn(() => 'Bearer malformed.jwt.token')
      };
      const res = mockResponse();

      await optionalAuth(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(req.user).toBeFalsy();
    });
  });

  describe('Middleware Chain', () => {
    test('should chain auth and requireSeller correctly', async () => {
      const token = generateTestToken(testUser._id, 'seller');
      const req = mockRequest(token);
      const res = mockResponse();

      // Mock user as seller
      const sellerUser = await User.create(createTestUser({
        email: 'seller@test.com',
        userType: 'seller'
      }));
      const sellerToken = generateTestToken(sellerUser._id, 'seller');
      const sellerReq = mockRequest(sellerToken);

      // First middleware: auth
      await auth(sellerReq, res, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Second middleware: requireSeller
      mockNext.mockClear();
      requireSeller(sellerReq, res, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    test('should chain auth and requireBuyer correctly', async () => {
      const token = generateTestToken(testUser._id, 'buyer');
      const req = mockRequest(token);
      const res = mockResponse();

      // First middleware: auth
      await auth(req, res, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Second middleware: requireBuyer
      mockNext.mockClear();
      requireBuyer(req, res, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    test('should block at requireSeller when user is buyer', async () => {
      const token = generateTestToken(testUser._id, 'buyer');
      const req = mockRequest(token);
      const res = mockResponse();

      // First middleware: auth
      await auth(req, res, mockNext);
      expect(mockNext).toHaveBeenCalled();

      // Second middleware: requireSeller (should block)
      mockNext.mockClear();
      requireSeller(req, res, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
