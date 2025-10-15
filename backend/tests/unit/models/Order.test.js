/**
 * Unit Tests for Order Model
 */

const mongoose = require('mongoose');
const Order = require('../../../models/Order');
const Book = require('../../../models/Book');
const User = require('../../../models/User');
const { setupTestDB, clearTestDB, closeTestDB, createTestUser, createTestBook, createTestOrder } = require('../../setup');

describe('Order Model Unit Tests', () => {
  let testBuyer, testSeller, testBook;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Create test users and book
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

  describe('Order Creation', () => {
    test('should create a valid order', async () => {
      const orderData = createTestOrder(testBuyer._id, testSeller._id, testBook._id);
      const order = await Order.create(orderData);

      expect(order).toBeDefined();
      expect(order._id).toBeDefined();
      expect(order.buyer.toString()).toBe(testBuyer._id.toString());
      expect(order.seller.toString()).toBe(testSeller._id.toString());
      expect(order.book.toString()).toBe(testBook._id.toString());
      expect(order.status).toBe('pending');
    });

    test('should fail without required fields', async () => {
      const invalidOrder = {
        buyer: testBuyer._id
        // Missing required fields
      };

      await expect(Order.create(invalidOrder)).rejects.toThrow();
    });

    test('should require minimum quantity of 1', async () => {
      const orderData = createTestOrder(testBuyer._id, testSeller._id, testBook._id, { quantity: 0 });

      await expect(Order.create(orderData)).rejects.toThrow();
    });

    test('should validate quantity minimum', async () => {
      const orderData = createTestOrder(testBuyer._id, testSeller._id, testBook._id, { quantity: -1 });

      await expect(Order.create(orderData)).rejects.toThrow();
    });

    test('should calculate total price correctly', async () => {
      const orderData = createTestOrder(testBuyer._id, testSeller._id, testBook._id, {
        quantity: 3,
        totalPrice: 300
      });

      const order = await Order.create(orderData);
      expect(order.totalPrice).toBe(300);
    });
  });

  describe('Order Status', () => {
    test('should default to pending status', async () => {
      const orderData = createTestOrder(testBuyer._id, testSeller._id, testBook._id);
      delete orderData.status;

      const order = await Order.create(orderData);
      expect(order.status).toBe('pending');
    });

    test('should validate status enum', async () => {
      const orderData = createTestOrder(testBuyer._id, testSeller._id, testBook._id, { status: 'invalid' });

      await expect(Order.create(orderData)).rejects.toThrow();
    });

    test('should accept all valid statuses', async () => {
      const statuses = ['pending', 'confirmed', 'delivered', 'refused'];

      for (const status of statuses) {
        const orderData = createTestOrder(testBuyer._id, testSeller._id, testBook._id, { status });
        const order = await Order.create(orderData);
        expect(order.status).toBe(status);
      }
    });

    test('should allow status updates', async () => {
      const order = await Order.create(
        createTestOrder(testBuyer._id, testSeller._id, testBook._id)
      );

      order.status = 'confirmed';
      await order.save();
      expect(order.status).toBe('confirmed');

      order.status = 'delivered';
      await order.save();
      expect(order.status).toBe('delivered');
    });
  });

  describe('Order Locations', () => {
    test('should store buyer location as GeoJSON', async () => {
      const orderData = createTestOrder(testBuyer._id, testSeller._id, testBook._id);
      const order = await Order.create(orderData);

      expect(order.buyerLocation).toBeDefined();
      expect(order.buyerLocation.type).toBe('Point');
      expect(order.buyerLocation.coordinates).toHaveLength(2);
      expect(order.buyerLocation.coordinates[0]).toBe(-7.5898); // longitude
      expect(order.buyerLocation.coordinates[1]).toBe(33.5731); // latitude
    });

    test('should store seller location as GeoJSON', async () => {
      const orderData = createTestOrder(testBuyer._id, testSeller._id, testBook._id);
      const order = await Order.create(orderData);

      expect(order.sellerLocation).toBeDefined();
      expect(order.sellerLocation.type).toBe('Point');
      expect(order.sellerLocation.coordinates).toHaveLength(2);
    });

    test('should include location names and addresses', async () => {
      const orderData = createTestOrder(testBuyer._id, testSeller._id, testBook._id);
      const order = await Order.create(orderData);

      expect(order.buyerLocation.name).toBe('Buyer Location');
      expect(order.buyerLocation.address).toBe('Test Delivery Address');
    });

    test('should require buyer location coordinates', async () => {
      const orderData = createTestOrder(testBuyer._id, testSeller._id, testBook._id);
      delete orderData.buyerLocation.coordinates;

      await expect(Order.create(orderData)).rejects.toThrow();
    });
  });

  describe('Order Notes', () => {
    test('should allow buyer notes', async () => {
      const orderData = createTestOrder(testBuyer._id, testSeller._id, testBook._id, {
        buyerNotes: 'Please deliver after 5 PM'
      });

      const order = await Order.create(orderData);
      expect(order.buyerNotes).toBe('Please deliver after 5 PM');
    });

    test('should allow seller notes', async () => {
      const order = await Order.create(
        createTestOrder(testBuyer._id, testSeller._id, testBook._id)
      );

      order.sellerNotes = 'Will deliver tomorrow';
      await order.save();

      expect(order.sellerNotes).toBe('Will deliver tomorrow');
    });

    test('should enforce maximum note length', async () => {
      const longNote = 'A'.repeat(501);
      const orderData = createTestOrder(testBuyer._id, testSeller._id, testBook._id, {
        buyerNotes: longNote
      });

      await expect(Order.create(orderData)).rejects.toThrow();
    });
  });

  describe('Order Inventory Tracking', () => {
    test('should default inventoryUpdated to false', async () => {
      const order = await Order.create(
        createTestOrder(testBuyer._id, testSeller._id, testBook._id)
      );

      expect(order.inventoryUpdated).toBe(false);
    });

    test('should track inventory updates', async () => {
      const order = await Order.create(
        createTestOrder(testBuyer._id, testSeller._id, testBook._id)
      );

      order.inventoryUpdated = true;
      await order.save();

      expect(order.inventoryUpdated).toBe(true);
    });
  });

  describe('Order Population', () => {
    test('should populate buyer correctly', async () => {
      const order = await Order.create(
        createTestOrder(testBuyer._id, testSeller._id, testBook._id)
      );

      const populatedOrder = await Order.findById(order._id).populate('buyer');

      expect(populatedOrder.buyer._id.toString()).toBe(testBuyer._id.toString());
      expect(populatedOrder.buyer.email).toBe('buyer@test.com');
    });

    test('should populate seller correctly', async () => {
      const order = await Order.create(
        createTestOrder(testBuyer._id, testSeller._id, testBook._id)
      );

      const populatedOrder = await Order.findById(order._id).populate('seller');

      expect(populatedOrder.seller._id.toString()).toBe(testSeller._id.toString());
      expect(populatedOrder.seller.email).toBe('seller@test.com');
    });

    test('should populate book correctly', async () => {
      const order = await Order.create(
        createTestOrder(testBuyer._id, testSeller._id, testBook._id)
      );

      const populatedOrder = await Order.findById(order._id).populate('book');

      expect(populatedOrder.book._id.toString()).toBe(testBook._id.toString());
      expect(populatedOrder.book.title).toBe('Test Book');
    });

    test('should populate all references at once', async () => {
      const order = await Order.create(
        createTestOrder(testBuyer._id, testSeller._id, testBook._id)
      );

      const populatedOrder = await Order.findById(order._id)
        .populate('buyer')
        .populate('seller')
        .populate('book');

      expect(populatedOrder.buyer.email).toBeDefined();
      expect(populatedOrder.seller.email).toBeDefined();
      expect(populatedOrder.book.title).toBeDefined();
    });
  });

  describe('Order Timestamps', () => {
    test('should automatically add createdAt and updatedAt', async () => {
      const order = await Order.create(
        createTestOrder(testBuyer._id, testSeller._id, testBook._id)
      );

      expect(order.createdAt).toBeDefined();
      expect(order.updatedAt).toBeDefined();
    });

    test('should update updatedAt on modification', async () => {
      const order = await Order.create(
        createTestOrder(testBuyer._id, testSeller._id, testBook._id)
      );
      const originalUpdatedAt = order.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 100));

      order.status = 'confirmed';
      await order.save();

      expect(order.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Order GeoJSON Export Tracking', () => {
    test('should default exportedToGeoJSON to false', async () => {
      const order = await Order.create(
        createTestOrder(testBuyer._id, testSeller._id, testBook._id)
      );

      expect(order.exportedToGeoJSON).toBe(false);
    });

    test('should track export status', async () => {
      const order = await Order.create(
        createTestOrder(testBuyer._id, testSeller._id, testBook._id)
      );

      order.exportedToGeoJSON = true;
      order.lastExportedAt = new Date();
      await order.save();

      expect(order.exportedToGeoJSON).toBe(true);
      expect(order.lastExportedAt).toBeDefined();
    });
  });
});
