/**
 * Integration Tests for Order Routes
 * Tests the complete order API including the fixed status update functionality
 */

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Book = require('../../models/Book');
const User = require('../../models/User');
const Order = require('../../models/Order');
const orderRoutes = require('../../routes/orders');
const { setupTestDB, clearTestDB, closeTestDB, generateTestToken, createTestUser, createTestBook, createTestOrder } = require('../setup');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/orders', orderRoutes);

describe('Order Routes Integration Tests', () => {
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

    // Create test book
    testBook = await Book.create(createTestBook(testSeller._id, {
      quantity: 10,
      price: 100
    }));

    // Generate auth tokens
    buyerToken = generateTestToken(testBuyer._id, 'buyer');
    sellerToken = generateTestToken(testSeller._id, 'seller');
  });

  describe('POST /api/orders', () => {
    test('should create order successfully', async () => {
      const orderData = {
        bookId: testBook._id,
        quantity: 2,
        orderType: 'delivery',
        buyerNotes: 'Test order',
        location: {
          coordinates: {
            latitude: 33.5731,
            longitude: -7.5898
          },
          name: 'Test Location',
          address: 'Test Address'
        }
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(orderData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Order created successfully');
      expect(response.body.order).toBeDefined();
      expect(response.body.order.quantity).toBe(2);
      expect(response.body.order.totalPrice).toBe(200);
    });

    test('should fail without authentication', async () => {
      const orderData = {
        bookId: testBook._id,
        quantity: 2,
        orderType: 'delivery'
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData);

      expect(response.status).toBe(401);
    });

    test('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ bookId: testBook._id });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/orders/my/seller', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await Order.create(
        createTestOrder(testBuyer._id, testSeller._id, testBook._id)
      );
    });

    test('should get seller orders successfully', async () => {
      const response = await request(app)
        .get('/api/orders/my/seller')
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.orders).toBeDefined();
      expect(response.body.orders.length).toBeGreaterThan(0);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/orders/my/seller');

      expect(response.status).toBe(401);
    });

    test('should fail with buyer token', async () => {
      const response = await request(app)
        .get('/api/orders/my/seller')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/orders/my/buyer', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await Order.create(
        createTestOrder(testBuyer._id, testSeller._id, testBook._id)
      );
    });

    test('should get buyer orders successfully', async () => {
      const response = await request(app)
        .get('/api/orders/my/buyer')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.orders).toBeDefined();
      expect(response.body.orders.length).toBeGreaterThan(0);
    });

    test('should include pagination info', async () => {
      const response = await request(app)
        .get('/api/orders/my/buyer')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBeDefined();
      expect(response.body.pagination.current).toBeDefined();
    });
  });

  describe('PUT /api/orders/:id/status - THE FIXED ENDPOINT', () => {
    let pendingOrder;

    beforeEach(async () => {
      pendingOrder = await Order.create(
        createTestOrder(testBuyer._id, testSeller._id, testBook._id, {
          quantity: 2,
          status: 'pending'
        })
      );
    });

    test('should confirm pending order successfully', async () => {
      const response = await request(app)
        .put(`/api/orders/${pendingOrder._id}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'confirmed' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Order status updated successfully');
      expect(response.body.order.status).toBe('confirmed');

      // Verify inventory was decremented
      const updatedBook = await Book.findById(testBook._id);
      expect(updatedBook.quantity).toBe(8); // 10 - 2
    });

    test('should handle book with quantity going to 0', async () => {
      // Create book with exact quantity matching order
      const lowStockBook = await Book.create(createTestBook(testSeller._id, {
        title: 'Low Stock Book',
        quantity: 2
      }));

      const order = await Order.create(
        createTestOrder(testBuyer._id, testSeller._id, lowStockBook._id, {
          quantity: 2,
          status: 'pending'
        })
      );

      const response = await request(app)
        .put(`/api/orders/${order._id}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'confirmed' });

      expect(response.status).toBe(200);

      // Verify book quantity is 0 and status is sold
      const updatedBook = await Book.findById(lowStockBook._id);
      expect(updatedBook.quantity).toBe(0);
      expect(updatedBook.status).toBe('sold');
    });

    test('should handle populated book field correctly (THE BUG WE FIXED)', async () => {
      // This tests the fix for the populated book field issue
      const order = await Order.findById(pendingOrder._id)
        .populate('buyer')
        .populate('seller')
        .populate('book'); // Book is populated here

      // Manually update the order to simulate the populated state
      const response = await request(app)
        .put(`/api/orders/${order._id}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'confirmed' });

      expect(response.status).toBe(200);
      expect(response.body.order.status).toBe('confirmed');
    });

    test('should refuse pending order', async () => {
      const response = await request(app)
        .put(`/api/orders/${pendingOrder._id}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'refused' });

      expect(response.status).toBe(200);
      expect(response.body.order.status).toBe('refused');

      // Verify inventory was NOT changed
      const updatedBook = await Book.findById(testBook._id);
      expect(updatedBook.quantity).toBe(10); // unchanged
    });

    test('should mark confirmed order as delivered', async () => {
      const confirmedOrder = await Order.create(
        createTestOrder(testBuyer._id, testSeller._id, testBook._id, {
          status: 'confirmed',
          inventoryUpdated: true
        })
      );

      const response = await request(app)
        .put(`/api/orders/${confirmedOrder._id}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'delivered' });

      expect(response.status).toBe(200);
      expect(response.body.order.status).toBe('delivered');
    });

    test('should refuse confirmed order and restore inventory', async () => {
      // First confirm the order
      await request(app)
        .put(`/api/orders/${pendingOrder._id}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'confirmed' });

      // Verify inventory decreased
      let book = await Book.findById(testBook._id);
      expect(book.quantity).toBe(8);

      // Now refuse the confirmed order
      const response = await request(app)
        .put(`/api/orders/${pendingOrder._id}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'refused' });

      expect(response.status).toBe(200);

      // Verify inventory was restored
      book = await Book.findById(testBook._id);
      expect(book.quantity).toBe(10); // back to original
    });

    test('should fail with insufficient stock', async () => {
      const lowStockBook = await Book.create(createTestBook(testSeller._id, {
        title: 'Low Stock Book',
        quantity: 1
      }));

      const order = await Order.create(
        createTestOrder(testBuyer._id, testSeller._id, lowStockBook._id, {
          quantity: 5 // More than available
        })
      );

      const response = await request(app)
        .put(`/api/orders/${order._id}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'confirmed' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Insufficient stock');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .put(`/api/orders/${pendingOrder._id}/status`)
        .send({ status: 'confirmed' });

      expect(response.status).toBe(401);
    });

    test('should fail with invalid status transition', async () => {
      const response = await request(app)
        .put(`/api/orders/${pendingOrder._id}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'delivered' }); // Can't go directly from pending to delivered

      expect(response.status).toBe(400);
    });

    test('should fail with non-participant user', async () => {
      const otherSeller = await User.create(createTestUser({
        email: 'otherseller@test.com',
        userType: 'seller'
      }));
      const otherToken = generateTestToken(otherSeller._id, 'seller');

      const response = await request(app)
        .put(`/api/orders/${pendingOrder._id}/status`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ status: 'confirmed' });

      expect(response.status).toBe(403);
    });

    test('should include notes when provided', async () => {
      const response = await request(app)
        .put(`/api/orders/${pendingOrder._id}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          status: 'confirmed',
          notes: 'Will deliver tomorrow'
        });

      expect(response.status).toBe(200);
      expect(response.body.order.sellerNotes).toBe('Will deliver tomorrow');
    });

    test('should fail with 404 for non-existent order', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/orders/${fakeId}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'confirmed' });

      expect(response.status).toBe(404);
    });
  });

  describe('Order Status Workflow', () => {
    test('should handle complete order workflow', async () => {
      // Step 1: Create order
      const orderData = {
        bookId: testBook._id,
        quantity: 2,
        orderType: 'delivery',
        location: {
          coordinates: { latitude: 33.5731, longitude: -7.5898 },
          name: 'Test Location'
        }
      };

      const createResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(orderData);

      expect(createResponse.status).toBe(201);
      const orderId = createResponse.body.order._id;

      // Step 2: Seller confirms order
      const confirmResponse = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'confirmed' });

      expect(confirmResponse.status).toBe(200);

      // Verify inventory decreased
      let book = await Book.findById(testBook._id);
      expect(book.quantity).toBe(8);

      // Step 3: Seller marks as delivered
      const deliverResponse = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'delivered' });

      expect(deliverResponse.status).toBe(200);
      expect(deliverResponse.body.order.status).toBe('delivered');
    });
  });
});
