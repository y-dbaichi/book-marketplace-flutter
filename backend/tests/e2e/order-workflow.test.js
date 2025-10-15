/**
 * End-to-End Tests for Complete Order Workflow
 * Tests the entire order lifecycle from creation to delivery
 */

const request = require('supertest');
const mongoose = require('mongoose');
const Book = require('../../models/Book');
const User = require('../../models/User');
const Order = require('../../models/Order');
const { setupTestDB, clearTestDB, closeTestDB, createTestUser, createTestBook } = require('../setup');

// We'll create a full app instance for E2E testing
const createApp = () => {
  const express = require('express');
  const app = express();

  app.use(express.json());
  app.use('/api/auth', require('../../routes/auth'));
  app.use('/api/books', require('../../routes/books'));
  app.use('/api/orders', require('../../routes/orders'));

  return app;
};

describe('E2E: Complete Order Workflow', () => {
  let app;
  let buyer, seller, book;
  let buyerToken, sellerToken;

  beforeAll(async () => {
    await setupTestDB();
    app = createApp();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('Full Order Lifecycle', () => {
    test('should complete entire order workflow: register → list book → create order → confirm → deliver', async () => {
      // ==========================================
      // STEP 1: Register users
      // ==========================================
      const buyerData = {
        email: 'buyer@e2e.com',
        password: 'BuyerPass123!',
        userType: 'buyer',
        profile: {
          firstName: 'Test',
          lastName: 'Buyer'
        },
        phone: '+1234567890',
        location: {
          coordinates: {
            latitude: 33.5731,
            longitude: -7.5898
          },
          name: 'Buyer Home',
          address: '123 Buyer Street'
        }
      };

      const buyerRegister = await request(app)
        .post('/api/auth/register')
        .send(buyerData);

      expect(buyerRegister.status).toBe(201);
      buyerToken = buyerRegister.body.token;

      const sellerData = {
        email: 'seller@e2e.com',
        password: 'SellerPass123!',
        userType: 'seller',
        profile: {
          firstName: 'Test',
          lastName: 'Seller'
        },
        phone: '+0987654321',
        location: {
          coordinates: {
            latitude: 33.5731,
            longitude: -7.5898
          },
          name: 'Seller Shop',
          address: '456 Seller Avenue'
        }
      };

      const sellerRegister = await request(app)
        .post('/api/auth/register')
        .send(sellerData);

      expect(sellerRegister.status).toBe(201);
      sellerToken = sellerRegister.body.token;

      // ==========================================
      // STEP 2: Seller creates book listing
      // ==========================================
      const bookData = {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        quality: 'excellent',
        quantity: 5,
        price: 150,
        description: 'Classic American novel',
        category: 'Fiction',
        condition: {
          hasWriting: false,
          hasHighlighting: false,
          hasDamage: false
        }
      };

      const createBook = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(bookData);

      expect(createBook.status).toBe(201);
      const bookId = createBook.body.book._id;

      // ==========================================
      // STEP 3: Buyer browses and finds the book
      // ==========================================
      const browseBooks = await request(app)
        .get('/api/books')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(browseBooks.status).toBe(200);
      expect(browseBooks.body.books.length).toBeGreaterThan(0);
      expect(browseBooks.body.books[0].title).toBe('The Great Gatsby');

      // ==========================================
      // STEP 4: Buyer creates an order
      // ==========================================
      const orderData = {
        bookId: bookId,
        quantity: 2,
        orderType: 'delivery',
        buyerNotes: 'Please deliver between 2-5 PM',
        location: {
          coordinates: {
            latitude: 33.5731,
            longitude: -7.5898
          },
          name: 'Buyer Home',
          address: '123 Buyer Street, Casablanca'
        }
      };

      const createOrder = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(orderData);

      expect(createOrder.status).toBe(201);
      expect(createOrder.body.order.status).toBe('pending');
      expect(createOrder.body.order.totalPrice).toBe(300); // 2 * 150
      const orderId = createOrder.body.order._id;

      // ==========================================
      // STEP 5: Buyer views their orders
      // ==========================================
      const buyerOrders = await request(app)
        .get('/api/orders/my/buyer')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(buyerOrders.status).toBe(200);
      expect(buyerOrders.body.orders.length).toBe(1);
      expect(buyerOrders.body.orders[0]._id).toBe(orderId);
      expect(buyerOrders.body.orders[0].status).toBe('pending');

      // ==========================================
      // STEP 6: Seller views incoming orders
      // ==========================================
      const sellerOrders = await request(app)
        .get('/api/orders/my/seller')
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(sellerOrders.status).toBe(200);
      expect(sellerOrders.body.orders.length).toBe(1);
      expect(sellerOrders.body.orders[0]._id).toBe(orderId);
      expect(sellerOrders.body.orders[0].buyerNotes).toBe('Please deliver between 2-5 PM');

      // ==========================================
      // STEP 7: Seller confirms the order
      // ==========================================
      const confirmOrder = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          status: 'confirmed',
          notes: 'Will deliver tomorrow afternoon'
        });

      expect(confirmOrder.status).toBe(200);
      expect(confirmOrder.body.order.status).toBe('confirmed');
      expect(confirmOrder.body.order.sellerNotes).toBe('Will deliver tomorrow afternoon');

      // ==========================================
      // STEP 8: Verify book inventory decreased
      // ==========================================
      const checkBook = await request(app)
        .get(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(checkBook.status).toBe(200);
      expect(checkBook.body.book.quantity).toBe(3); // 5 - 2 = 3

      // ==========================================
      // STEP 9: Buyer checks updated order status
      // ==========================================
      const updatedBuyerOrders = await request(app)
        .get('/api/orders/my/buyer')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(updatedBuyerOrders.body.orders[0].status).toBe('confirmed');

      // ==========================================
      // STEP 10: Seller delivers the order
      // ==========================================
      const deliverOrder = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'delivered' });

      expect(deliverOrder.status).toBe(200);
      expect(deliverOrder.body.order.status).toBe('delivered');

      // ==========================================
      // STEP 11: Final verification
      // ==========================================
      const finalOrders = await request(app)
        .get('/api/orders/my/buyer')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(finalOrders.body.orders[0].status).toBe('delivered');

      // Verify book quantity is still 3
      const finalBook = await Book.findById(bookId);
      expect(finalBook.quantity).toBe(3);
      expect(finalBook.status).toBe('available'); // Still available because some stock remains
    });

    test('should handle order cancellation workflow', async () => {
      // Setup users and book
      const buyer = await User.create(createTestUser({
        email: 'buyer2@e2e.com',
        userType: 'buyer'
      }));

      const seller = await User.create(createTestUser({
        email: 'seller2@e2e.com',
        userType: 'seller'
      }));

      const book = await Book.create(createTestBook(seller._id, {
        quantity: 10
      }));

      const buyerToken = require('jsonwebtoken').sign(
        { userId: buyer._id, userType: 'buyer' },
        process.env.JWT_SECRET || 'test-secret-key'
      );

      const sellerToken = require('jsonwebtoken').sign(
        { userId: seller._id, userType: 'seller' },
        process.env.JWT_SECRET || 'test-secret-key'
      );

      // Create order
      const createOrder = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          bookId: book._id,
          quantity: 3,
          orderType: 'delivery',
          location: {
            coordinates: { latitude: 33.5731, longitude: -7.5898 },
            name: 'Test'
          }
        });

      const orderId = createOrder.body.order._id;

      // Confirm order (inventory decreases)
      await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'confirmed' });

      let updatedBook = await Book.findById(book._id);
      expect(updatedBook.quantity).toBe(7); // 10 - 3

      // Refuse order (inventory should be restored)
      const refuseOrder = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'refused' });

      expect(refuseOrder.status).toBe(200);

      // Verify inventory restored
      updatedBook = await Book.findById(book._id);
      expect(updatedBook.quantity).toBe(10); // back to 10
    });

    test('should handle sold out scenario', async () => {
      // Setup users and book with limited stock
      const buyer = await User.create(createTestUser({
        email: 'buyer3@e2e.com',
        userType: 'buyer'
      }));

      const seller = await User.create(createTestUser({
        email: 'seller3@e2e.com',
        userType: 'seller'
      }));

      const book = await Book.create(createTestBook(seller._id, {
        title: 'Limited Edition Book',
        quantity: 2 // Only 2 copies
      }));

      const buyerToken = require('jsonwebtoken').sign(
        { userId: buyer._id, userType: 'buyer' },
        process.env.JWT_SECRET || 'test-secret-key'
      );

      const sellerToken = require('jsonwebtoken').sign(
        { userId: seller._id, userType: 'seller' },
        process.env.JWT_SECRET || 'test-secret-key'
      );

      // Create order for all remaining stock
      const createOrder = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          bookId: book._id,
          quantity: 2, // Order all remaining copies
          orderType: 'delivery',
          location: {
            coordinates: { latitude: 33.5731, longitude: -7.5898 },
            name: 'Test'
          }
        });

      const orderId = createOrder.body.order._id;

      // Confirm order (should sell out the book)
      const confirmOrder = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'confirmed' });

      expect(confirmOrder.status).toBe(200);

      // Verify book is sold out
      const soldOutBook = await Book.findById(book._id);
      expect(soldOutBook.quantity).toBe(0);
      expect(soldOutBook.status).toBe('sold');

      // Verify book doesn't appear in available listings
      const availableBooks = await request(app)
        .get('/api/books?status=available')
        .set('Authorization', `Bearer ${buyerToken}`);

      const foundBook = availableBooks.body.books.find(b => b._id === book._id.toString());
      expect(foundBook).toBeUndefined();
    });
  });
});
