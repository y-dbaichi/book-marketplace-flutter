/**
 * Integration Tests for GeoJSON Routes
 * Tests GeoJSON export generation, download, preview, and deletion
 */

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const GeoJSONExport = require('../../models/GeoJSONExport');
const User = require('../../models/User');
const Book = require('../../models/Book');
const Order = require('../../models/Order');
const geojsonRoutes = require('../../routes/geojson');
const { setupTestDB, clearTestDB, closeTestDB, generateTestToken, createTestUser, createTestBook, createTestOrder } = require('../setup');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/geojson', geojsonRoutes);

describe('GeoJSON Routes Integration Tests', () => {
  let testBuyer, testSeller, testBook, buyerToken, sellerToken;

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

    // Generate auth tokens
    buyerToken = generateTestToken(testBuyer._id, 'buyer');
    sellerToken = generateTestToken(testSeller._id, 'seller');

    // Create some confirmed orders for testing
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
  });

  describe('POST /api/geojson/generate', () => {
    test('should generate GeoJSON export successfully', async () => {
      const response = await request(app)
        .post('/api/geojson/generate')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          exportType: 'buyer_orders'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('generated successfully');
      expect(response.body.export).toBeDefined();
      expect(response.body.export.exportType).toBe('buyer_orders');
      expect(response.body.export.status).toBe('ready');
      expect(response.body.export.fileName).toBeDefined();
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/geojson/generate')
        .send({
          exportType: 'buyer_orders'
        });

      expect(response.status).toBe(401);
    });

    test('should fail with missing exportType', async () => {
      const response = await request(app)
        .post('/api/geojson/generate')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    test('should fail with invalid exportType', async () => {
      const response = await request(app)
        .post('/api/geojson/generate')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          exportType: 'invalid_type'
        });

      expect(response.status).toBe(400);
    });

    test('should accept valid exportTypes', async () => {
      const types = ['buyer_orders', 'customer_orders', 'all_orders'];

      for (const type of types) {
        const response = await request(app)
          .post('/api/geojson/generate')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({ exportType: type });

        expect(response.status).toBe(201);
        expect(response.body.export.exportType).toBe(type);
      }
    });

    test('should set expiration date 30 days in future', async () => {
      const response = await request(app)
        .post('/api/geojson/generate')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ exportType: 'buyer_orders' });

      expect(response.body.export.expiresAt).toBeDefined();

      const expiresAt = new Date(response.body.export.expiresAt);
      const now = new Date();
      const daysDiff = (expiresAt - now) / (1000 * 60 * 60 * 24);

      expect(daysDiff).toBeGreaterThan(29);
      expect(daysDiff).toBeLessThan(31);
    });

    test('should store file size', async () => {
      const response = await request(app)
        .post('/api/geojson/generate')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ exportType: 'buyer_orders' });

      expect(response.body.export.fileSize).toBeDefined();
      expect(response.body.export.fileSize).toBeGreaterThan(0);
    });

    test('should accept optional filters', async () => {
      const response = await request(app)
        .post('/api/geojson/generate')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          exportType: 'buyer_orders',
          filters: {
            status: 'confirmed',
            dateFrom: '2024-01-01'
          }
        });

      expect(response.status).toBe(201);
    });
  });

  describe('GET /api/geojson/my-exports', () => {
    beforeEach(async () => {
      // Create multiple exports for the user
      await GeoJSONExport.create({
        user: testBuyer._id,
        exportType: 'buyer_orders',
        fileName: 'export1.geojson',
        geoJSONData: { type: 'FeatureCollection', features: [] },
        status: 'ready'
      });

      await GeoJSONExport.create({
        user: testBuyer._id,
        exportType: 'customer_orders',
        fileName: 'export2.geojson',
        geoJSONData: { type: 'FeatureCollection', features: [] },
        status: 'ready'
      });

      // Create export for another user
      await GeoJSONExport.create({
        user: testSeller._id,
        exportType: 'buyer_orders',
        fileName: 'export3.geojson',
        geoJSONData: { type: 'FeatureCollection', features: [] },
        status: 'ready'
      });
    });

    test('should get user exports successfully', async () => {
      const response = await request(app)
        .get('/api/geojson/my-exports')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.exports).toBeDefined();
      expect(response.body.exports.length).toBe(2);
      expect(response.body.exports.every(exp => exp.user._id === testBuyer._id.toString())).toBe(true);
    });

    test('should sort by creation date descending', async () => {
      const response = await request(app)
        .get('/api/geojson/my-exports')
        .set('Authorization', `Bearer ${buyerToken}`);

      const exports = response.body.exports;
      for (let i = 1; i < exports.length; i++) {
        const prevDate = new Date(exports[i - 1].createdAt);
        const currDate = new Date(exports[i].createdAt);
        expect(prevDate >= currDate).toBe(true);
      }
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/geojson/my-exports');

      expect(response.status).toBe(401);
    });

    test('should return empty array for user with no exports', async () => {
      const newUser = await User.create(createTestUser({
        email: 'newuser@test.com',
        userType: 'buyer'
      }));
      const newToken = generateTestToken(newUser._id, 'buyer');

      const response = await request(app)
        .get('/api/geojson/my-exports')
        .set('Authorization', `Bearer ${newToken}`);

      expect(response.status).toBe(200);
      expect(response.body.exports.length).toBe(0);
    });

    test('should include download count', async () => {
      const response = await request(app)
        .get('/api/geojson/my-exports')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.body.exports[0].downloadCount).toBeDefined();
    });
  });

  describe('GET /api/geojson/preview/:id', () => {
    let testExport;

    beforeEach(async () => {
      // Create an export with multiple features
      const features = Array.from({ length: 15 }, (_, i) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [-7.5898 + i * 0.01, 33.5731 + i * 0.01]
        },
        properties: {
          orderId: `order${i}`,
          bookTitle: `Book ${i}`
        }
      }));

      testExport = await GeoJSONExport.create({
        user: testBuyer._id,
        exportType: 'buyer_orders',
        fileName: 'preview_test.geojson',
        geoJSONData: {
          type: 'FeatureCollection',
          features
        },
        status: 'ready'
      });
    });

    test('should preview export successfully', async () => {
      const response = await request(app)
        .get(`/api/geojson/preview/${testExport._id}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.preview).toBeDefined();
      expect(response.body.preview.type).toBe('FeatureCollection');
      expect(response.body.preview.features).toBeDefined();
    });

    test('should limit preview to first 10 features', async () => {
      const response = await request(app)
        .get(`/api/geojson/preview/${testExport._id}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.body.preview.features.length).toBeLessThanOrEqual(10);
      expect(response.body.totalFeatures).toBe(15);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/geojson/preview/${testExport._id}`);

      expect(response.status).toBe(401);
    });

    test('should fail with invalid export id', async () => {
      const response = await request(app)
        .get('/api/geojson/preview/invalid-id')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(400);
    });

    test('should fail with non-existent export', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/geojson/preview/${fakeId}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(404);
    });

    test('should fail when accessing another user export', async () => {
      const response = await request(app)
        .get(`/api/geojson/preview/${testExport._id}`)
        .set('Authorization', `Bearer ${sellerToken}`); // Different user

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/geojson/download/:id', () => {
    let testExport;

    beforeEach(async () => {
      testExport = await GeoJSONExport.create({
        user: testBuyer._id,
        exportType: 'buyer_orders',
        fileName: 'download_test.geojson',
        geoJSONData: {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [-7.5898, 33.5731] },
            properties: { orderId: 'test123' }
          }]
        },
        status: 'ready',
        downloadCount: 0
      });
    });

    test('should download export successfully', async () => {
      const response = await request(app)
        .get(`/api/geojson/download/${testExport._id}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.type).toBe('FeatureCollection');
      expect(response.body.features).toBeDefined();
    });

    test('should increment download count', async () => {
      await request(app)
        .get(`/api/geojson/download/${testExport._id}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      const updatedExport = await GeoJSONExport.findById(testExport._id);
      expect(updatedExport.downloadCount).toBe(1);
      expect(updatedExport.lastDownloaded).toBeDefined();
    });

    test('should increment download count multiple times', async () => {
      for (let i = 1; i <= 3; i++) {
        await request(app)
          .get(`/api/geojson/download/${testExport._id}`)
          .set('Authorization', `Bearer ${buyerToken}`);

        const updatedExport = await GeoJSONExport.findById(testExport._id);
        expect(updatedExport.downloadCount).toBe(i);
      }
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/geojson/download/${testExport._id}`);

      expect(response.status).toBe(401);
    });

    test('should fail when accessing another user export', async () => {
      const response = await request(app)
        .get(`/api/geojson/download/${testExport._id}`)
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(response.status).toBe(403);
    });

    test('should fail with expired export', async () => {
      testExport.status = 'expired';
      await testExport.save();

      const response = await request(app)
        .get(`/api/geojson/download/${testExport._id}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(410);
    });

    test('should fail with generating export', async () => {
      testExport.status = 'generating';
      await testExport.save();

      const response = await request(app)
        .get(`/api/geojson/download/${testExport._id}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(202);
    });
  });

  describe('DELETE /api/geojson/:id', () => {
    let testExport;

    beforeEach(async () => {
      testExport = await GeoJSONExport.create({
        user: testBuyer._id,
        exportType: 'buyer_orders',
        fileName: 'delete_test.geojson',
        geoJSONData: { type: 'FeatureCollection', features: [] },
        status: 'ready'
      });
    });

    test('should delete export successfully', async () => {
      const response = await request(app)
        .delete(`/api/geojson/${testExport._id}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Export deleted successfully');

      // Verify deletion
      const deletedExport = await GeoJSONExport.findById(testExport._id);
      expect(deletedExport).toBeNull();
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/geojson/${testExport._id}`);

      expect(response.status).toBe(401);
    });

    test('should fail when deleting another user export', async () => {
      const response = await request(app)
        .delete(`/api/geojson/${testExport._id}`)
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(response.status).toBe(403);
    });

    test('should fail with invalid export id', async () => {
      const response = await request(app)
        .delete('/api/geojson/invalid-id')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(400);
    });

    test('should fail with non-existent export', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/geojson/${fakeId}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GeoJSON Export Workflow', () => {
    test('should complete full workflow: generate -> preview -> download -> delete', async () => {
      // Step 1: Generate export
      const generateResponse = await request(app)
        .post('/api/geojson/generate')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ exportType: 'buyer_orders' });

      expect(generateResponse.status).toBe(201);
      const exportId = generateResponse.body.export._id;

      // Step 2: List exports
      const listResponse = await request(app)
        .get('/api/geojson/my-exports')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.exports.length).toBeGreaterThan(0);

      // Step 3: Preview export
      const previewResponse = await request(app)
        .get(`/api/geojson/preview/${exportId}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(previewResponse.status).toBe(200);

      // Step 4: Download export
      const downloadResponse = await request(app)
        .get(`/api/geojson/download/${exportId}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(downloadResponse.status).toBe(200);

      // Step 5: Delete export
      const deleteResponse = await request(app)
        .delete(`/api/geojson/${exportId}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(deleteResponse.status).toBe(200);

      // Step 6: Verify deletion
      const finalListResponse = await request(app)
        .get('/api/geojson/my-exports')
        .set('Authorization', `Bearer ${buyerToken}`);

      const deletedExport = finalListResponse.body.exports.find(exp => exp._id === exportId);
      expect(deletedExport).toBeUndefined();
    });
  });
});
