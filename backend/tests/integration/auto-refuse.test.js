/**
 * Integration Tests for Auto-Refuse Feature
 * Tests the automatic refusal of orders when stock is depleted
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

describe('Auto-Refuse Feature Tests', () => {
  let testBuyer1, testBuyer2, testBuyer3, testSeller, testBook;
  let buyer1Token, buyer2Token, buyer3Token, sellerToken;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Create test users
    testBuyer1 = await User.create(createTestUser({
      email: 'buyer1@test.com',
      userType: 'buyer'
    }));

    testBuyer2 = await User.create(createTestUser({
      email: 'buyer2@test.com',
      userType: 'buyer'
    }));

    testBuyer3 = await User.create(createTestUser({
      email: 'buyer3@test.com',
      userType: 'buyer'
    }));

    testSeller = await User.create(createTestUser({
      email: 'seller@test.com',
      userType: 'seller'
    }));

    // Create test book with limited stock
    testBook = await Book.create(createTestBook(testSeller._id, {
      title: 'Limited Stock Book',
      quantity: 5,
      price: 100
    }));

    // Generate auth tokens
    buyer1Token = generateTestToken(testBuyer1._id, 'buyer');
    buyer2Token = generateTestToken(testBuyer2._id, 'buyer');
    buyer3Token = generateTestToken(testBuyer3._id, 'buyer');
    sellerToken = generateTestToken(testSeller._id, 'seller');
  });

  test('should auto-refuse other pending orders when stock goes to 0', async () => {
    // Create 3 pending orders for the same book
    const order1 = await Order.create(
      createTestOrder(testBuyer1._id, testSeller._id, testBook._id, {
        quantity: 5, // This will deplete all stock
        status: 'pending'
      })
    );

    const order2 = await Order.create(
      createTestOrder(testBuyer2._id, testSeller._id, testBook._id, {
        quantity: 2,
        status: 'pending'
      })
    );

    const order3 = await Order.create(
      createTestOrder(testBuyer3._id, testSeller._id, testBook._id, {
        quantity: 1,
        status: 'pending'
      })
    );

    // Confirm the first order (should deplete all stock)
    const response = await request(app)
      .put(`/api/orders/${order1._id}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'confirmed' });

    expect(response.status).toBe(200);
    expect(response.body.order.status).toBe('confirmed');

    // Check that the book is sold out
    const updatedBook = await Book.findById(testBook._id);
    expect(updatedBook.quantity).toBe(0);
    expect(updatedBook.status).toBe('sold');

    // Check that other orders were auto-refused
    const updatedOrder2 = await Order.findById(order2._id);
    const updatedOrder3 = await Order.findById(order3._id);

    expect(updatedOrder2.status).toBe('refused');
    expect(updatedOrder3.status).toBe('refused');

    // Check that seller notes were added
    expect(updatedOrder2.sellerNotes).toContain('sold out');
    expect(updatedOrder3.sellerNotes).toContain('sold out');
  });

  test('should auto-refuse orders that exceed remaining stock', async () => {
    // Create orders
    const order1 = await Order.create(
      createTestOrder(testBuyer1._id, testSeller._id, testBook._id, {
        quantity: 3, // Leaves 2 remaining
        status: 'pending'
      })
    );

    const order2 = await Order.create(
      createTestOrder(testBuyer2._id, testSeller._id, testBook._id, {
        quantity: 4, // Exceeds remaining stock
        status: 'pending'
      })
    );

    const order3 = await Order.create(
      createTestOrder(testBuyer3._id, testSeller._id, testBook._id, {
        quantity: 1, // Can still be fulfilled
        status: 'pending'
      })
    );

    // Confirm the first order
    const response = await request(app)
      .put(`/api/orders/${order1._id}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'confirmed' });

    expect(response.status).toBe(200);

    // Check remaining stock
    const updatedBook = await Book.findById(testBook._id);
    expect(updatedBook.quantity).toBe(2); // 5 - 3

    // Order 2 should be auto-refused (needs 4, only 2 available)
    const updatedOrder2 = await Order.findById(order2._id);
    expect(updatedOrder2.status).toBe('refused');
    expect(updatedOrder2.sellerNotes).toContain('Insufficient stock');
    expect(updatedOrder2.sellerNotes).toContain('Only 2 copies remain');

    // Order 3 should still be pending (needs 1, 2 available)
    const updatedOrder3 = await Order.findById(order3._id);
    expect(updatedOrder3.status).toBe('pending');
  });

  test('should not auto-refuse orders if stock is sufficient', async () => {
    // Create orders that don't exceed stock
    const order1 = await Order.create(
      createTestOrder(testBuyer1._id, testSeller._id, testBook._id, {
        quantity: 2,
        status: 'pending'
      })
    );

    const order2 = await Order.create(
      createTestOrder(testBuyer2._id, testSeller._id, testBook._id, {
        quantity: 2,
        status: 'pending'
      })
    );

    // Confirm the first order
    const response = await request(app)
      .put(`/api/orders/${order1._id}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'confirmed' });

    expect(response.status).toBe(200);

    // Check that order 2 is still pending
    const updatedOrder2 = await Order.findById(order2._id);
    expect(updatedOrder2.status).toBe('pending'); // Still pending, not refused
  });

  test('should return clear error message when trying to confirm order with insufficient stock', async () => {
    // Deplete stock first
    testBook.quantity = 0;
    testBook.status = 'sold';
    await testBook.save();

    const order = await Order.create(
      createTestOrder(testBuyer1._id, testSeller._id, testBook._id, {
        quantity: 2,
        status: 'pending'
      })
    );

    // Try to confirm
    const response = await request(app)
      .put(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'confirmed' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Insufficient stock');
    expect(response.body.message).toContain('Only 0 copies available');
    expect(response.body.message).toContain('order requires 2');
  });
});
