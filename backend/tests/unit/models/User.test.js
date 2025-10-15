/**
 * Unit Tests for User Model
 */

const mongoose = require('mongoose');
const User = require('../../../models/User');
const { setupTestDB, clearTestDB, closeTestDB } = require('../../setup');

describe('User Model Unit Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('User Creation', () => {
    test('should create a valid buyer user', async () => {
      const userData = {
        email: 'buyer@test.com',
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

      const user = await User.create(userData);

      expect(user).toBeDefined();
      expect(user._id).toBeDefined();
      expect(user.email).toBe('buyer@test.com');
      expect(user.userType).toBe('buyer');
      expect(user.profile.firstName).toBe('John');
      expect(user.profile.lastName).toBe('Doe');
      expect(user.phone).toBe('+1234567890');
    });

    test('should create a valid seller user', async () => {
      const userData = {
        email: 'seller@test.com',
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

      const user = await User.create(userData);

      expect(user.userType).toBe('seller');
      expect(user.email).toBe('seller@test.com');
    });

    test('should fail without required fields', async () => {
      const invalidUser = {
        email: 'test@test.com'
        // Missing password and userType
      };

      await expect(User.create(invalidUser)).rejects.toThrow();
    });

    test('should require email', async () => {
      const userData = {
        password: 'TestPass123!',
        userType: 'buyer'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    test('should require password', async () => {
      const userData = {
        email: 'test@test.com',
        userType: 'buyer'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    test('should require userType', async () => {
      const userData = {
        email: 'test@test.com',
        password: 'TestPass123!'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    test('should enforce unique email', async () => {
      const userData = {
        email: 'duplicate@test.com',
        password: 'TestPass123!',
        userType: 'buyer',
        phone: '+1234567890',
        location: {
          coordinates: { latitude: 33.5731, longitude: -7.5898 },
          name: 'Home',
          address: '123 Test St'
        }
      };

      await User.create(userData);

      // Try to create another user with same email
      await expect(User.create(userData)).rejects.toThrow();
    });

    test('should validate email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'TestPass123!',
        userType: 'buyer'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    test('should validate userType enum', async () => {
      const userData = {
        email: 'test@test.com',
        password: 'TestPass123!',
        userType: 'admin' // Invalid userType
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    test('should accept buyer and seller userTypes', async () => {
      const buyer = await User.create({
        email: 'buyer@test.com',
        password: 'TestPass123!',
        userType: 'buyer',
        phone: '+1234567890',
        location: {
          coordinates: { latitude: 33.5731, longitude: -7.5898 },
          name: 'Home',
          address: '123 Test St'
        }
      });

      const seller = await User.create({
        email: 'seller@test.com',
        password: 'TestPass123!',
        userType: 'seller',
        phone: '+9876543210',
        location: {
          coordinates: { latitude: 33.5731, longitude: -7.5898 },
          name: 'Store',
          address: '456 Store St'
        }
      });

      expect(buyer.userType).toBe('buyer');
      expect(seller.userType).toBe('seller');
    });
  });

  describe('Password Hashing', () => {
    test('should hash password before saving', async () => {
      const plainPassword = 'TestPass123!';
      const user = await User.create({
        email: 'test@test.com',
        password: plainPassword,
        userType: 'buyer',
        phone: '+1234567890',
        location: {
          coordinates: { latitude: 33.5731, longitude: -7.5898 },
          name: 'Home',
          address: '123 Test St'
        }
      });

      expect(user.password).toBeDefined();
      expect(user.password).not.toBe(plainPassword);
      expect(user.password.length).toBeGreaterThan(plainPassword.length);
    });

    test('should compare passwords correctly', async () => {
      const plainPassword = 'TestPass123!';
      const user = await User.create({
        email: 'test@test.com',
        password: plainPassword,
        userType: 'buyer',
        phone: '+1234567890',
        location: {
          coordinates: { latitude: 33.5731, longitude: -7.5898 },
          name: 'Home',
          address: '123 Test St'
        }
      });

      const isMatch = await user.comparePassword(plainPassword);
      expect(isMatch).toBe(true);
    });

    test('should reject incorrect passwords', async () => {
      const user = await User.create({
        email: 'test@test.com',
        password: 'CorrectPass123!',
        userType: 'buyer',
        phone: '+1234567890',
        location: {
          coordinates: { latitude: 33.5731, longitude: -7.5898 },
          name: 'Home',
          address: '123 Test St'
        }
      });

      const isMatch = await user.comparePassword('WrongPass123!');
      expect(isMatch).toBe(false);
    });

    test('should not rehash unchanged password on update', async () => {
      const user = await User.create({
        email: 'test@test.com',
        password: 'TestPass123!',
        userType: 'buyer',
        phone: '+1234567890',
        location: {
          coordinates: { latitude: 33.5731, longitude: -7.5898 },
          name: 'Home',
          address: '123 Test St'
        }
      });

      const originalHash = user.password;

      // Update non-password field
      user.profile = { firstName: 'Updated', lastName: 'Name' };
      await user.save();

      expect(user.password).toBe(originalHash);
    });
  });

  describe('User Profile', () => {
    test('should store profile information', async () => {
      const user = await User.create({
        email: 'test@test.com',
        password: 'TestPass123!',
        userType: 'buyer',
        phone: '+1234567890',
        location: {
          coordinates: { latitude: 33.5731, longitude: -7.5898 },
          name: 'Home',
          address: '123 Test St'
        },
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          bio: 'Book enthusiast'
        }
      });

      expect(user.profile.firstName).toBe('John');
      expect(user.profile.lastName).toBe('Doe');
      expect(user.profile.bio).toBe('Book enthusiast');
    });

    test('should work without optional profile fields', async () => {
      const user = await User.create({
        email: 'test@test.com',
        password: 'TestPass123!',
        userType: 'buyer',
        phone: '+1234567890',
        location: {
          coordinates: { latitude: 33.5731, longitude: -7.5898 },
          name: 'Home',
          address: '123 Test St'
        }
      });

      expect(user.profile).toBeDefined();
    });

    test('should enforce maximum length for bio', async () => {
      const longBio = 'A'.repeat(501);
      const userData = {
        email: 'test@test.com',
        password: 'TestPass123!',
        userType: 'buyer',
        profile: {
          bio: longBio
        }
      };

      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe('User Location', () => {
    test('should store location with coordinates', async () => {
      const user = await User.create({
        email: 'test@test.com',
        password: 'TestPass123!',
        userType: 'seller',
        phone: '+1234567890',
        location: {
          coordinates: {
            latitude: 33.5731,
            longitude: -7.5898
          },
          name: 'My Store',
          address: '123 Main St, Casablanca'
        }
      });

      expect(user.location.coordinates.latitude).toBe(33.5731);
      expect(user.location.coordinates.longitude).toBe(-7.5898);
      expect(user.location.name).toBe('My Store');
      expect(user.location.address).toBe('123 Main St, Casablanca');
    });

    test('should require location fields', async () => {
      const userWithoutLocation = {
        email: 'test@test.com',
        password: 'TestPass123!',
        userType: 'buyer',
        phone: '+1234567890'
        // Missing location
      };

      await expect(User.create(userWithoutLocation)).rejects.toThrow();
    });

    test('should validate latitude range', async () => {
      const userData = {
        email: 'test@test.com',
        password: 'TestPass123!',
        userType: 'buyer',
        location: {
          coordinates: {
            latitude: 91, // Invalid: > 90
            longitude: -7.5898
          }
        }
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    test('should validate longitude range', async () => {
      const userData = {
        email: 'test@test.com',
        password: 'TestPass123!',
        userType: 'buyer',
        location: {
          coordinates: {
            latitude: 33.5731,
            longitude: 181 // Invalid: > 180
          }
        }
      };

      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe('User Phone', () => {
    test('should store phone number', async () => {
      const user = await User.create({
        email: 'test@test.com',
        password: 'TestPass123!',
        userType: 'buyer',
        phone: '+1234567890',
        location: {
          coordinates: { latitude: 33.5731, longitude: -7.5898 },
          name: 'Home',
          address: '123 Test St'
        }
      });

      expect(user.phone).toBe('+1234567890');
    });

    test('should require phone number', async () => {
      const userWithoutPhone = {
        email: 'test@test.com',
        password: 'TestPass123!',
        userType: 'buyer',
        location: {
          coordinates: { latitude: 33.5731, longitude: -7.5898 },
          name: 'Home',
          address: '123 Test St'
        }
        // Missing phone
      };

      await expect(User.create(userWithoutPhone)).rejects.toThrow();
    });
  });

  describe('User JSON Serialization', () => {
    test('should exclude password from JSON output', async () => {
      const user = await User.create({
        email: 'test@test.com',
        password: 'TestPass123!',
        userType: 'buyer',
        phone: '+1234567890',
        location: {
          coordinates: { latitude: 33.5731, longitude: -7.5898 },
          name: 'Home',
          address: '123 Test St'
        }
      });

      const userJSON = user.toJSON();

      expect(userJSON.password).toBeUndefined();
      expect(userJSON.email).toBe('test@test.com');
    });

    test('should include other fields in JSON output', async () => {
      const user = await User.create({
        email: 'test@test.com',
        password: 'TestPass123!',
        userType: 'buyer',
        phone: '+1234567890',
        location: {
          coordinates: { latitude: 33.5731, longitude: -7.5898 },
          name: 'Home',
          address: '123 Test St'
        },
        profile: {
          firstName: 'John',
          lastName: 'Doe'
        }
      });

      const userJSON = user.toJSON();

      expect(userJSON._id).toBeDefined();
      expect(userJSON.email).toBe('test@test.com');
      expect(userJSON.userType).toBe('buyer');
      expect(userJSON.profile.firstName).toBe('John');
      expect(userJSON.phone).toBe('+1234567890');
      expect(userJSON.password).toBeUndefined();
    });
  });

  describe('User Timestamps', () => {
    test('should automatically add createdAt and updatedAt', async () => {
      const user = await User.create({
        email: 'test@test.com',
        password: 'TestPass123!',
        userType: 'buyer',
        phone: '+1234567890',
        location: {
          coordinates: { latitude: 33.5731, longitude: -7.5898 },
          name: 'Home',
          address: '123 Test St'
        }
      });

      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    test('should update updatedAt on modification', async () => {
      const user = await User.create({
        email: 'test@test.com',
        password: 'TestPass123!',
        userType: 'buyer',
        phone: '+1234567890',
        location: {
          coordinates: { latitude: 33.5731, longitude: -7.5898 },
          name: 'Home',
          address: '123 Test St'
        }
      });

      const originalUpdatedAt = user.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 100));

      user.phone = '+9876543210';
      await user.save();

      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    test('should not change createdAt on modification', async () => {
      const user = await User.create({
        email: 'test@test.com',
        password: 'TestPass123!',
        userType: 'buyer',
        phone: '+1234567890',
        location: {
          coordinates: { latitude: 33.5731, longitude: -7.5898 },
          name: 'Home',
          address: '123 Test St'
        }
      });

      const originalCreatedAt = user.createdAt;

      await new Promise(resolve => setTimeout(resolve, 100));

      user.phone = '+9876543210';
      await user.save();

      expect(user.createdAt.getTime()).toBe(originalCreatedAt.getTime());
    });
  });

  describe('User Queries', () => {
    beforeEach(async () => {
      // Create multiple users
      await User.create({
        email: 'buyer1@test.com',
        password: 'TestPass123!',
        userType: 'buyer',
        phone: '+1234567890',
        location: {
          coordinates: { latitude: 33.5731, longitude: -7.5898 },
          name: 'Home',
          address: '123 Test St'
        }
      });

      await User.create({
        email: 'buyer2@test.com',
        password: 'TestPass123!',
        userType: 'buyer',
        phone: '+1234567891',
        location: {
          coordinates: { latitude: 33.5731, longitude: -7.5898 },
          name: 'Home',
          address: '456 Test Ave'
        }
      });

      await User.create({
        email: 'seller1@test.com',
        password: 'TestPass123!',
        userType: 'seller',
        phone: '+9876543210',
        location: {
          coordinates: { latitude: 33.5731, longitude: -7.5898 },
          name: 'Store',
          address: '789 Store Blvd'
        }
      });
    });

    test('should find user by email', async () => {
      const user = await User.findOne({ email: 'buyer1@test.com' });

      expect(user).toBeDefined();
      expect(user.email).toBe('buyer1@test.com');
      expect(user.userType).toBe('buyer');
    });

    test('should find users by userType', async () => {
      const buyers = await User.find({ userType: 'buyer' });
      const sellers = await User.find({ userType: 'seller' });

      expect(buyers.length).toBe(2);
      expect(sellers.length).toBe(1);
    });

    test('should count users', async () => {
      const totalUsers = await User.countDocuments();
      const buyerCount = await User.countDocuments({ userType: 'buyer' });

      expect(totalUsers).toBe(3);
      expect(buyerCount).toBe(2);
    });
  });

  describe('User Update', () => {
    test('should update user profile', async () => {
      const user = await User.create({
        email: 'test@test.com',
        password: 'TestPass123!',
        userType: 'buyer',
        phone: '+1234567890',
        location: {
          coordinates: { latitude: 33.5731, longitude: -7.5898 },
          name: 'Home',
          address: '123 Test St'
        }
      });

      user.profile = {
        firstName: 'Updated',
        lastName: 'Name'
      };
      await user.save();

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.profile.firstName).toBe('Updated');
      expect(updatedUser.profile.lastName).toBe('Name');
    });

    test('should update phone number', async () => {
      const user = await User.create({
        email: 'test@test.com',
        password: 'TestPass123!',
        userType: 'buyer',
        phone: '+1234567890',
        location: {
          coordinates: { latitude: 33.5731, longitude: -7.5898 },
          name: 'Home',
          address: '123 Test St'
        }
      });

      user.phone = '+9876543210';
      await user.save();

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.phone).toBe('+9876543210');
    });

    test('should update location', async () => {
      const user = await User.create({
        email: 'test@test.com',
        password: 'TestPass123!',
        userType: 'seller',
        phone: '+1234567890',
        location: {
          coordinates: {
            latitude: 33.5731,
            longitude: -7.5898
          },
          name: 'Old Location',
          address: 'Old Address'
        }
      });

      user.location = {
        coordinates: {
          latitude: 34.0522,
          longitude: -118.2437
        },
        name: 'New Location',
        address: 'New Address'
      };
      await user.save();

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.location.name).toBe('New Location');
      expect(updatedUser.location.coordinates.latitude).toBe(34.0522);
    });
  });

  describe('User Deletion', () => {
    test('should delete user', async () => {
      const user = await User.create({
        email: 'test@test.com',
        password: 'TestPass123!',
        userType: 'buyer',
        phone: '+1234567890',
        location: {
          coordinates: { latitude: 33.5731, longitude: -7.5898 },
          name: 'Home',
          address: '123 Test St'
        }
      });

      await User.findByIdAndDelete(user._id);

      const deletedUser = await User.findById(user._id);
      expect(deletedUser).toBeNull();
    });
  });
});
