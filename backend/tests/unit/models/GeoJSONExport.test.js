/**
 * Unit Tests for GeoJSONExport Model
 */

const mongoose = require('mongoose');
const GeoJSONExport = require('../../../models/GeoJSONExport');
const User = require('../../../models/User');
const Book = require('../../../models/Book');
const Order = require('../../../models/Order');
const { setupTestDB, clearTestDB, closeTestDB, createTestUser, createTestBook, createTestOrder } = require('../../setup');

describe('GeoJSONExport Model Unit Tests', () => {
  let testBuyer, testSeller, testBook;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Create test users
    testBuyer = await User.create(createTestUser({
      email: 'buyer@test.com',
      userType: 'buyer'
    }));

    testSeller = await User.create(createTestUser({
      email: 'seller@test.com',
      userType: 'seller'
    }));

    testBook = await Book.create(createTestBook(testSeller._id));
  });

  describe('GeoJSONExport Creation', () => {
    test('should create a valid export', async () => {
      const exportData = {
        user: testBuyer._id,
        exportType: 'buyer_orders',
        fileName: 'test_export.geojson',
        geoJSONData: {
          type: 'FeatureCollection',
          features: []
        },
        status: 'ready'
      };

      const geoExport = await GeoJSONExport.create(exportData);

      expect(geoExport).toBeDefined();
      expect(geoExport._id).toBeDefined();
      expect(geoExport.user.toString()).toBe(testBuyer._id.toString());
      expect(geoExport.exportType).toBe('buyer_orders');
      expect(geoExport.fileName).toBe('test_export.geojson');
      expect(geoExport.status).toBe('ready');
    });

    test('should fail without required fields', async () => {
      const invalidExport = {
        fileName: 'test.geojson'
        // Missing user and exportType
      };

      await expect(GeoJSONExport.create(invalidExport)).rejects.toThrow();
    });

    test('should require user reference', async () => {
      const exportData = {
        exportType: 'buyer_orders',
        fileName: 'test.geojson'
      };

      await expect(GeoJSONExport.create(exportData)).rejects.toThrow();
    });

    test('should require exportType', async () => {
      const exportData = {
        user: testBuyer._id,
        fileName: 'test.geojson'
      };

      await expect(GeoJSONExport.create(exportData)).rejects.toThrow();
    });

    test('should validate exportType enum', async () => {
      const exportData = {
        user: testBuyer._id,
        exportType: 'invalid_type',
        fileName: 'test.geojson'
      };

      await expect(GeoJSONExport.create(exportData)).rejects.toThrow();
    });

    test('should accept valid exportTypes', async () => {
      const types = ['buyer_orders', 'customer_orders', 'all_orders'];

      for (const type of types) {
        const exportData = {
          user: testBuyer._id,
          exportType: type,
          fileName: `test_${type}.geojson`,
          geoJSONData: { type: 'FeatureCollection', features: [] }
        };
        const geoExport = await GeoJSONExport.create(exportData);
        expect(geoExport.exportType).toBe(type);
      }
    });
  });

  describe('GeoJSONExport Status', () => {
    test('should default to generating status', async () => {
      const exportData = {
        user: testBuyer._id,
        exportType: 'buyer_orders',
        fileName: 'test.geojson'
      };

      const geoExport = await GeoJSONExport.create(exportData);
      expect(geoExport.status).toBe('generating');
    });

    test('should validate status enum', async () => {
      const exportData = {
        user: testBuyer._id,
        exportType: 'buyer_orders',
        fileName: 'test.geojson',
        status: 'invalid_status'
      };

      await expect(GeoJSONExport.create(exportData)).rejects.toThrow();
    });

    test('should accept valid statuses', async () => {
      const statuses = ['generating', 'ready', 'expired', 'error'];

      for (const status of statuses) {
        const exportData = {
          user: testBuyer._id,
          exportType: 'buyer_orders',
          fileName: `test_${status}.geojson`,
          status
        };
        const geoExport = await GeoJSONExport.create(exportData);
        expect(geoExport.status).toBe(status);
      }
    });

    test('should allow status updates', async () => {
      const geoExport = await GeoJSONExport.create({
        user: testBuyer._id,
        exportType: 'buyer_orders',
        fileName: 'test.geojson'
      });

      expect(geoExport.status).toBe('generating');

      geoExport.status = 'ready';
      await geoExport.save();
      expect(geoExport.status).toBe('ready');

      geoExport.status = 'expired';
      await geoExport.save();
      expect(geoExport.status).toBe('expired');
    });
  });

  describe('GeoJSONExport Download Tracking', () => {
    test('should default downloadCount to 0', async () => {
      const geoExport = await GeoJSONExport.create({
        user: testBuyer._id,
        exportType: 'buyer_orders',
        fileName: 'test.geojson'
      });

      expect(geoExport.downloadCount).toBe(0);
    });

    test('should track download count', async () => {
      const geoExport = await GeoJSONExport.create({
        user: testBuyer._id,
        exportType: 'buyer_orders',
        fileName: 'test.geojson'
      });

      geoExport.downloadCount += 1;
      geoExport.lastDownloaded = new Date();
      await geoExport.save();

      expect(geoExport.downloadCount).toBe(1);
      expect(geoExport.lastDownloaded).toBeDefined();
    });

    test('should increment download count multiple times', async () => {
      const geoExport = await GeoJSONExport.create({
        user: testBuyer._id,
        exportType: 'buyer_orders',
        fileName: 'test.geojson'
      });

      for (let i = 1; i <= 5; i++) {
        geoExport.downloadCount += 1;
        await geoExport.save();
        expect(geoExport.downloadCount).toBe(i);
      }
    });
  });

  describe('GeoJSONExport Data Storage', () => {
    test('should store GeoJSON data', async () => {
      const geoJSONData = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [-7.5898, 33.5731]
            },
            properties: {
              orderId: 'test123',
              bookTitle: 'Test Book'
            }
          }
        ]
      };

      const geoExport = await GeoJSONExport.create({
        user: testBuyer._id,
        exportType: 'buyer_orders',
        fileName: 'test.geojson',
        geoJSONData
      });

      expect(geoExport.geoJSONData).toBeDefined();
      expect(geoExport.geoJSONData.type).toBe('FeatureCollection');
      expect(geoExport.geoJSONData.features).toHaveLength(1);
      expect(geoExport.geoJSONData.features[0].properties.bookTitle).toBe('Test Book');
    });

    test('should store file size', async () => {
      const geoJSONData = {
        type: 'FeatureCollection',
        features: []
      };

      const fileSize = JSON.stringify(geoJSONData).length;

      const geoExport = await GeoJSONExport.create({
        user: testBuyer._id,
        exportType: 'buyer_orders',
        fileName: 'test.geojson',
        geoJSONData,
        fileSize
      });

      expect(geoExport.fileSize).toBe(fileSize);
      expect(geoExport.fileSize).toBeGreaterThan(0);
    });

    test('should store filters', async () => {
      const filters = {
        status: 'confirmed',
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31'
      };

      const geoExport = await GeoJSONExport.create({
        user: testBuyer._id,
        exportType: 'buyer_orders',
        fileName: 'test.geojson',
        filters
      });

      expect(geoExport.filters).toBeDefined();
      expect(geoExport.filters.status).toBe('confirmed');
      expect(geoExport.filters.dateFrom).toBe('2024-01-01');
    });
  });

  describe('GeoJSONExport Expiration', () => {
    test('should set expiration date', async () => {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const geoExport = await GeoJSONExport.create({
        user: testBuyer._id,
        exportType: 'buyer_orders',
        fileName: 'test.geojson',
        expiresAt
      });

      expect(geoExport.expiresAt).toBeDefined();
      expect(geoExport.expiresAt).toBeInstanceOf(Date);
    });

    test('should check if export is expired', async () => {
      // Create expired export
      const expiredExport = await GeoJSONExport.create({
        user: testBuyer._id,
        exportType: 'buyer_orders',
        fileName: 'expired.geojson',
        expiresAt: new Date(Date.now() - 1000) // Already expired
      });

      // Create valid export
      const validExport = await GeoJSONExport.create({
        user: testBuyer._id,
        exportType: 'buyer_orders',
        fileName: 'valid.geojson',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const now = new Date();
      expect(expiredExport.expiresAt < now).toBe(true);
      expect(validExport.expiresAt > now).toBe(true);
    });
  });

  describe('GeoJSONExport Population', () => {
    test('should populate user correctly', async () => {
      const geoExport = await GeoJSONExport.create({
        user: testBuyer._id,
        exportType: 'buyer_orders',
        fileName: 'test.geojson'
      });

      const populatedExport = await GeoJSONExport.findById(geoExport._id).populate('user');

      expect(populatedExport.user._id.toString()).toBe(testBuyer._id.toString());
      expect(populatedExport.user.email).toBe('buyer@test.com');
    });
  });

  describe('GeoJSONExport Timestamps', () => {
    test('should automatically add createdAt and updatedAt', async () => {
      const geoExport = await GeoJSONExport.create({
        user: testBuyer._id,
        exportType: 'buyer_orders',
        fileName: 'test.geojson'
      });

      expect(geoExport.createdAt).toBeDefined();
      expect(geoExport.updatedAt).toBeDefined();
      expect(geoExport.createdAt).toBeInstanceOf(Date);
      expect(geoExport.updatedAt).toBeInstanceOf(Date);
    });

    test('should update updatedAt on modification', async () => {
      const geoExport = await GeoJSONExport.create({
        user: testBuyer._id,
        exportType: 'buyer_orders',
        fileName: 'test.geojson'
      });

      const originalUpdatedAt = geoExport.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 100));

      geoExport.downloadCount += 1;
      await geoExport.save();

      expect(geoExport.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('GeoJSONExport Static Method: generateForUser', () => {
    beforeEach(async () => {
      // Create confirmed orders with proper structure
      await Order.create(
        createTestOrder(testBuyer._id, testSeller._id, testBook._id, {
          status: 'confirmed',
          quantity: 2
        })
      );

      await Order.create(
        createTestOrder(testBuyer._id, testSeller._id, testBook._id, {
          status: 'confirmed',
          quantity: 1
        })
      );

      // Create a pending order (should not be included)
      await Order.create(
        createTestOrder(testBuyer._id, testSeller._id, testBook._id, {
          status: 'pending',
          quantity: 1
        })
      );
    });

    test('should generate export for buyer orders', async () => {
      const geoExport = await GeoJSONExport.generateForUser(
        testBuyer._id,
        'buyer_orders'
      );

      expect(geoExport).toBeDefined();
      expect(geoExport.user.toString()).toBe(testBuyer._id.toString());
      expect(geoExport.exportType).toBe('buyer_orders');
      expect(geoExport.status).toBe('ready');
      expect(geoExport.fileName).toContain('buyer_orders');
      expect(geoExport.expiresAt).toBeDefined();
    });

    test('should set expiration to 30 days', async () => {
      const geoExport = await GeoJSONExport.generateForUser(
        testBuyer._id,
        'buyer_orders'
      );

      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      const expectedExpiration = new Date(Date.now() + thirtyDays);
      const timeDiff = Math.abs(geoExport.expiresAt - expectedExpiration);

      // Allow 1 second tolerance
      expect(timeDiff).toBeLessThan(1000);
    });

    test('should calculate file size', async () => {
      const geoExport = await GeoJSONExport.generateForUser(
        testBuyer._id,
        'buyer_orders'
      );

      expect(geoExport.fileSize).toBeDefined();
      expect(geoExport.fileSize).toBeGreaterThan(0);
    });

    test('should store filters when provided', async () => {
      const filters = { status: 'confirmed' };
      const geoExport = await GeoJSONExport.generateForUser(
        testBuyer._id,
        'buyer_orders',
        filters
      );

      expect(geoExport.filters).toBeDefined();
      expect(geoExport.filters.status).toBe('confirmed');
    });

    test('should generate unique file names', async () => {
      const export1 = await GeoJSONExport.generateForUser(
        testBuyer._id,
        'buyer_orders'
      );

      await new Promise(resolve => setTimeout(resolve, 10));

      const export2 = await GeoJSONExport.generateForUser(
        testBuyer._id,
        'buyer_orders'
      );

      expect(export1.fileName).not.toBe(export2.fileName);
    });

    test('should handle user with no orders', async () => {
      const anotherBuyer = await User.create(createTestUser({
        email: 'another@test.com',
        userType: 'buyer'
      }));

      const geoExport = await GeoJSONExport.generateForUser(
        anotherBuyer._id,
        'buyer_orders'
      );

      expect(geoExport).toBeDefined();
      expect(geoExport.status).toBe('ready');
    });
  });

  describe('GeoJSONExport Queries', () => {
    beforeEach(async () => {
      // Create multiple exports
      await GeoJSONExport.create({
        user: testBuyer._id,
        exportType: 'buyer_orders',
        fileName: 'export1.geojson',
        status: 'ready'
      });

      await GeoJSONExport.create({
        user: testBuyer._id,
        exportType: 'customer_orders',
        fileName: 'export2.geojson',
        status: 'ready'
      });

      await GeoJSONExport.create({
        user: testSeller._id,
        exportType: 'buyer_orders',
        fileName: 'export3.geojson',
        status: 'expired'
      });
    });

    test('should find exports by user', async () => {
      const exports = await GeoJSONExport.find({ user: testBuyer._id });

      expect(exports).toHaveLength(2);
      expect(exports.every(exp => exp.user.toString() === testBuyer._id.toString())).toBe(true);
    });

    test('should find exports by status', async () => {
      const readyExports = await GeoJSONExport.find({ status: 'ready' });
      const expiredExports = await GeoJSONExport.find({ status: 'expired' });

      expect(readyExports).toHaveLength(2);
      expect(expiredExports).toHaveLength(1);
    });

    test('should find exports by export type', async () => {
      const buyerOrdersExports = await GeoJSONExport.find({ exportType: 'buyer_orders' });

      expect(buyerOrdersExports).toHaveLength(2);
    });

    test('should sort exports by creation date', async () => {
      const exports = await GeoJSONExport.find().sort({ createdAt: -1 });

      expect(exports).toHaveLength(3);
      expect(exports[0].createdAt >= exports[1].createdAt).toBe(true);
      expect(exports[1].createdAt >= exports[2].createdAt).toBe(true);
    });
  });

  describe('GeoJSONExport Deletion', () => {
    test('should delete export', async () => {
      const geoExport = await GeoJSONExport.create({
        user: testBuyer._id,
        exportType: 'buyer_orders',
        fileName: 'test.geojson'
      });

      await GeoJSONExport.findByIdAndDelete(geoExport._id);

      const deletedExport = await GeoJSONExport.findById(geoExport._id);
      expect(deletedExport).toBeNull();
    });

    test('should delete multiple exports by user', async () => {
      await GeoJSONExport.create({
        user: testBuyer._id,
        exportType: 'buyer_orders',
        fileName: 'export1.geojson'
      });

      await GeoJSONExport.create({
        user: testBuyer._id,
        exportType: 'customer_orders',
        fileName: 'export2.geojson'
      });

      await GeoJSONExport.deleteMany({ user: testBuyer._id });

      const remaining = await GeoJSONExport.find({ user: testBuyer._id });
      expect(remaining).toHaveLength(0);
    });
  });
});
