/**
 * Integration Tests for Auth Routes
 * Tests registration, login, profile management, and token refresh
 */

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../../models/User');
const authRoutes = require('../../routes/auth');
const { setupTestDB, clearTestDB, closeTestDB, generateTestToken } = require('../setup');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('POST /api/auth/register', () => {
    test('should register a new buyer successfully', async () => {
      const userData = {
        email: 'newbuyer@test.com',
        password: 'TestPass123!',
        userType: 'buyer',
        profile: {
          firstName: 'John',
          lastName: 'Doe'
        },
        phone: '+1234567890',
        location: {
          coordinates: {
            latitude: 33.5731,
            longitude: -7.5898
          },
          name: 'Home',
          address: '123 Test St'
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('newbuyer@test.com');
      expect(response.body.user.userType).toBe('buyer');
      expect(response.body.user.password).toBeUndefined(); // Password should not be returned
    });

    test('should register a new seller successfully', async () => {
      const userData = {
        email: 'newseller@test.com',
        password: 'TestPass123!',
        userType: 'seller',
        profile: {
          firstName: 'Jane',
          lastName: 'Smith'
        },
        phone: '+9876543210',
        location: {
          coordinates: {
            latitude: 33.5731,
            longitude: -7.5898
          },
          name: 'Seller Store',
          address: '456 Seller Ave'
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.user.userType).toBe('seller');
    });

    test('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'incomplete@test.com'
          // Missing password and userType
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });

    test('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'TestPass123!',
          userType: 'buyer'
        });

      expect(response.status).toBe(400);
    });

    test('should fail with duplicate email', async () => {
      const userData = {
        email: 'duplicate@test.com',
        password: 'TestPass123!',
        userType: 'buyer',
        phone: '+1234567890',
        location: {
          coordinates: {
            latitude: 33.5731,
            longitude: -7.5898
          },
          name: 'Home',
          address: '123 Test St'
        }
      };

      // First registration should succeed
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Second registration with same email should fail
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already exists');
    });

    test('should fail with invalid userType', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: 'TestPass123!',
          userType: 'admin' // Invalid userType
        });

      expect(response.status).toBe(400);
    });

    test('should fail with invalid location coordinates', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: 'TestPass123!',
          userType: 'buyer',
          location: {
            coordinates: {
              latitude: 91, // Invalid: > 90
              longitude: -7.5898
            }
          }
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      // Create a test user
      testUser = await User.create({
        email: 'testuser@test.com',
        password: 'TestPass123!',
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
          name: 'Home',
          address: '123 Test St'
        }
      });
    });

    test('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@test.com',
          password: 'TestPass123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('testuser@test.com');
      expect(response.body.user.password).toBeUndefined();
    });

    test('should fail with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@test.com',
          password: 'WrongPassword123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid');
    });

    test('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'TestPass123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid');
    });

    test('should fail with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@test.com'
          // Missing password
        });

      expect(response.status).toBe(400);
    });

    test('should return user with correct userType', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@test.com',
          password: 'TestPass123!'
        });

      expect(response.body.user.userType).toBe('buyer');
    });
  });

  describe('GET /api/auth/me', () => {
    let testUser, authToken;

    beforeEach(async () => {
      testUser = await User.create({
        email: 'testuser@test.com',
        password: 'TestPass123!',
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
          name: 'Home',
          address: '123 Test St'
        }
      });

      authToken = generateTestToken(testUser._id, 'buyer');
    });

    test('should get current user profile successfully', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('testuser@test.com');
      expect(response.body.user.profile.firstName).toBe('Test');
      expect(response.body.user.password).toBeUndefined();
    });

    test('should fail without authentication token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    test('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    test('should fail with deleted user', async () => {
      const deletedUser = await User.create({
        email: 'deleted@test.com',
        password: 'TestPass123!',
        userType: 'buyer',
        phone: '+1234567890',
        location: {
          coordinates: {
            latitude: 33.5731,
            longitude: -7.5898
          },
          name: 'Home',
          address: '123 Test St'
        }
      });

      const token = generateTestToken(deletedUser._id, 'buyer');

      await User.findByIdAndDelete(deletedUser._id);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/auth/profile', () => {
    let testUser, authToken;

    beforeEach(async () => {
      testUser = await User.create({
        email: 'testuser@test.com',
        password: 'TestPass123!',
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
          name: 'Home',
          address: '123 Test St'
        }
      });

      authToken = generateTestToken(testUser._id, 'buyer');
    });

    test('should update profile successfully', async () => {
      const updateData = {
        profile: {
          firstName: 'Updated',
          lastName: 'Name',
          bio: 'New bio'
        },
        phone: '+9876543210'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.user.profile.firstName).toBe('Updated');
      expect(response.body.user.profile.lastName).toBe('Name');
      expect(response.body.user.phone).toBe('+9876543210');
    });

    test('should update location', async () => {
      const updateData = {
        location: {
          coordinates: {
            latitude: 34.0522,
            longitude: -118.2437
          },
          name: 'New Location',
          address: 'New Address'
        }
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.user.location.name).toBe('New Location');
      expect(response.body.user.location.coordinates.latitude).toBe(34.0522);
    });

    test('should not allow email update', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'newemail@test.com'
        });

      // Email shouldn't change
      const user = await User.findById(testUser._id);
      expect(user.email).toBe('testuser@test.com');
    });

    test('should not allow userType update', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userType: 'seller'
        });

      // UserType shouldn't change
      const user = await User.findById(testUser._id);
      expect(user.userType).toBe('buyer');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({
          profile: {
            firstName: 'Updated'
          }
        });

      expect(response.status).toBe(401);
    });

    test('should fail with invalid location coordinates', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          location: {
            coordinates: {
              latitude: 91, // Invalid
              longitude: -7.5898
            }
          }
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        email: 'testuser@test.com',
        password: 'TestPass123!',
        userType: 'buyer',
        phone: '+1234567890',
        location: {
          coordinates: {
            latitude: 33.5731,
            longitude: -7.5898
          },
          name: 'Home',
          address: '123 Test St'
        }
      });
    });

    test('should refresh token successfully', async () => {
      // First login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@test.com',
          password: 'TestPass123!'
        });

      const originalToken = loginResponse.body.token;

      // Use token to get a new refreshed token
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${originalToken}`);

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
    });

    test('should fail with missing auth token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh');

      expect(response.status).toBe(401);
    });

    test('should fail with invalid auth token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    let testUser, authToken;

    beforeEach(async () => {
      testUser = await User.create({
        email: 'testuser@test.com',
        password: 'TestPass123!',
        userType: 'buyer',
        phone: '+1234567890',
        location: {
          coordinates: {
            latitude: 33.5731,
            longitude: -7.5898
          },
          name: 'Home',
          address: '123 Test St'
        }
      });

      authToken = generateTestToken(testUser._id, 'buyer');
    });

    test('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logout successful');
    });

    test('should logout even without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(200);
    });
  });

  describe('Authentication Flow', () => {
    test('should complete full registration and login flow', async () => {
      // Step 1: Register
      const registerData = {
        email: 'flowtest@test.com',
        password: 'TestPass123!',
        userType: 'buyer',
        profile: {
          firstName: 'Flow',
          lastName: 'Test'
        },
        phone: '+1234567890',
        location: {
          coordinates: {
            latitude: 33.5731,
            longitude: -7.5898
          },
          name: 'Home',
          address: '123 Test St'
        }
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(registerData);

      expect(registerResponse.status).toBe(201);
      const registrationToken = registerResponse.body.token;

      // Step 2: Use token to access profile
      const profileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${registrationToken}`);

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.user.email).toBe('flowtest@test.com');

      // Step 3: Logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${registrationToken}`);

      expect(logoutResponse.status).toBe(200);

      // Step 4: Login again
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'flowtest@test.com',
          password: 'TestPass123!'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.token).toBeDefined();
    });
  });
});
