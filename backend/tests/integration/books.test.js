/**
 * Integration Tests for Books Routes
 * Tests book CRUD operations, search, filtering, and authorization
 */

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Book = require('../../models/Book');
const User = require('../../models/User');
const bookRoutes = require('../../routes/books');
const { setupTestDB, clearTestDB, closeTestDB, generateTestToken, createTestUser, createTestBook } = require('../setup');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/books', bookRoutes);

describe('Books Routes Integration Tests', () => {
  let testBuyer, testSeller, buyerToken, sellerToken;

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

    // Generate auth tokens
    buyerToken = generateTestToken(testBuyer._id, 'buyer');
    sellerToken = generateTestToken(testSeller._id, 'seller');
  });

  describe('POST /api/books', () => {
    test('should create book as seller successfully', async () => {
      const bookData = {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        quality: 'excellent',
        quantity: 5,
        price: 150,
        description: 'Classic American novel',
        category: 'Fiction',
        isbn: '978-0743273565',
        condition: {
          hasWriting: false,
          hasHighlighting: false,
          hasDamage: false
        }
      };

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(bookData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Book listed successfully');
      expect(response.body.book).toBeDefined();
      expect(response.body.book.title).toBe('The Great Gatsby');
      expect(response.body.book.seller._id).toBe(testSeller._id.toString());
      expect(response.body.book.seller.email).toBe('seller@test.com');
      expect(response.body.book.status).toBe('available');
    });

    test('should fail without authentication', async () => {
      const bookData = {
        title: 'Test Book',
        author: 'Test Author',
        quality: 'good',
        quantity: 5,
        price: 100
      };

      const response = await request(app)
        .post('/api/books')
        .send(bookData);

      expect(response.status).toBe(401);
    });

    test('should fail with buyer account', async () => {
      const bookData = {
        title: 'Test Book',
        author: 'Test Author',
        quality: 'good',
        quantity: 5,
        price: 100
      };

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(bookData);

      expect(response.status).toBe(403);
    });

    test('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          title: 'Incomplete Book'
          // Missing author, quality, quantity, price
        });

      expect(response.status).toBe(400);
    });

    test('should fail with invalid quality', async () => {
      const bookData = {
        title: 'Test Book',
        author: 'Test Author',
        quality: 'invalid-quality',
        quantity: 5,
        price: 100
      };

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(bookData);

      expect(response.status).toBe(400);
    });

    test('should fail with negative price', async () => {
      const bookData = {
        title: 'Test Book',
        author: 'Test Author',
        quality: 'good',
        quantity: 5,
        price: -100
      };

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(bookData);

      expect(response.status).toBe(400);
    });

    test('should fail with negative quantity', async () => {
      const bookData = {
        title: 'Test Book',
        author: 'Test Author',
        quality: 'good',
        quantity: -5,
        price: 100
      };

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(bookData);

      expect(response.status).toBe(400);
    });

    test('should create book with minimum required fields', async () => {
      const bookData = {
        title: 'Minimal Book',
        author: 'Minimal Author',
        quality: 'good',
        quantity: 1,
        price: 50
      };

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(bookData);

      expect(response.status).toBe(201);
      expect(response.body.book.title).toBe('Minimal Book');
    });
  });

  describe('GET /api/books', () => {
    beforeEach(async () => {
      // Create multiple books
      await Book.create(createTestBook(testSeller._id, {
        title: 'Fiction Book 1',
        category: 'Fiction',
        quality: 'excellent',
        price: 100
      }));

      await Book.create(createTestBook(testSeller._id, {
        title: 'Science Book 1',
        category: 'Science',
        quality: 'good',
        price: 150
      }));

      await Book.create(createTestBook(testSeller._id, {
        title: 'Fiction Book 2',
        category: 'Fiction',
        quality: 'fair',
        price: 80
      }));
    });

    test('should get all available books', async () => {
      const response = await request(app)
        .get('/api/books');

      expect(response.status).toBe(200);
      expect(response.body.books).toBeDefined();
      expect(response.body.books.length).toBeGreaterThan(0);
      expect(response.body.pagination).toBeDefined();
    });

    test('should work without authentication', async () => {
      const response = await request(app)
        .get('/api/books');

      expect(response.status).toBe(200);
    });

    test('should filter by category', async () => {
      const response = await request(app)
        .get('/api/books?category=Fiction');

      expect(response.status).toBe(200);
      expect(response.body.books.length).toBe(2);
      expect(response.body.books.every(book => book.category === 'Fiction')).toBe(true);
    });

    test('should filter by quality', async () => {
      const response = await request(app)
        .get('/api/books?quality=excellent');

      expect(response.status).toBe(200);
      expect(response.body.books.every(book => book.quality === 'excellent')).toBe(true);
    });

    test('should filter by price range', async () => {
      const response = await request(app)
        .get('/api/books?minPrice=80&maxPrice=120');

      expect(response.status).toBe(200);
      expect(response.body.books.every(book => book.price >= 80 && book.price <= 120)).toBe(true);
    });

    test('should search by title', async () => {
      const response = await request(app)
        .get('/api/books?search=Fiction');

      expect(response.status).toBe(200);
      expect(response.body.books.length).toBe(2);
    });

    test('should sort by price ascending', async () => {
      const response = await request(app)
        .get('/api/books?sortBy=price&sortOrder=asc');

      expect(response.status).toBe(200);
      const prices = response.body.books.map(book => book.price);
      expect(prices[0]).toBeLessThanOrEqual(prices[1]);
    });

    test('should sort by price descending', async () => {
      const response = await request(app)
        .get('/api/books?sortBy=price&sortOrder=desc');

      expect(response.status).toBe(200);
      const prices = response.body.books.map(book => book.price);
      expect(prices[0]).toBeGreaterThanOrEqual(prices[1]);
    });

    test('should paginate results', async () => {
      const response = await request(app)
        .get('/api/books?page=1&limit=2');

      expect(response.status).toBe(200);
      expect(response.body.books.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.current).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });

    test('should combine multiple filters', async () => {
      const response = await request(app)
        .get('/api/books?category=Fiction&quality=excellent&minPrice=50&maxPrice=150');

      expect(response.status).toBe(200);
      expect(response.body.books.every(book =>
        book.category === 'Fiction' &&
        book.quality === 'excellent' &&
        book.price >= 50 &&
        book.price <= 150
      )).toBe(true);
    });
  });

  describe('GET /api/books/:id', () => {
    let testBook;

    beforeEach(async () => {
      testBook = await Book.create(createTestBook(testSeller._id));
    });

    test('should get book by id successfully', async () => {
      const response = await request(app)
        .get(`/api/books/${testBook._id}`);

      expect(response.status).toBe(200);
      expect(response.body.book).toBeDefined();
      expect(response.body.book._id).toBe(testBook._id.toString());
      expect(response.body.book.title).toBe(testBook.title);
    });

    test('should populate seller information', async () => {
      const response = await request(app)
        .get(`/api/books/${testBook._id}`);

      expect(response.body.book.seller).toBeDefined();
      expect(response.body.book.seller.email).toBe('seller@test.com');
      expect(response.body.book.seller.password).toBeUndefined();
    });

    test('should fail with invalid book id', async () => {
      const response = await request(app)
        .get('/api/books/invalid-id');

      expect(response.status).toBe(404);
    });

    test('should fail with non-existent book id', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/books/${fakeId}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/books/:id', () => {
    let testBook;

    beforeEach(async () => {
      testBook = await Book.create(createTestBook(testSeller._id));
    });

    test('should update book as owner successfully', async () => {
      const updateData = {
        title: 'Updated Title',
        price: 200,
        quantity: 10
      };

      const response = await request(app)
        .put(`/api/books/${testBook._id}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Book updated successfully');
      expect(response.body.book.title).toBe('Updated Title');
      expect(response.body.book.price).toBe(200);
      expect(response.body.book.quantity).toBe(10);
    });

    test('should update condition fields', async () => {
      const updateData = {
        condition: {
          hasWriting: true,
          hasHighlighting: true,
          hasDamage: false
        }
      };

      const response = await request(app)
        .put(`/api/books/${testBook._id}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.book.condition.hasWriting).toBe(true);
      expect(response.body.book.condition.hasHighlighting).toBe(true);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .put(`/api/books/${testBook._id}`)
        .send({ price: 200 });

      expect(response.status).toBe(401);
    });

    test('should fail when not the owner', async () => {
      const anotherSeller = await User.create(createTestUser({
        email: 'another@test.com',
        userType: 'seller'
      }));
      const anotherToken = generateTestToken(anotherSeller._id, 'seller');

      const response = await request(app)
        .put(`/api/books/${testBook._id}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ price: 200 });

      expect(response.status).toBe(403);
    });

    test('should fail with buyer account', async () => {
      const response = await request(app)
        .put(`/api/books/${testBook._id}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ price: 200 });

      expect(response.status).toBe(403);
    });

    test('should fail with invalid book id', async () => {
      const response = await request(app)
        .put('/api/books/invalid-id')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ price: 200 });

      expect(response.status).toBe(404);
    });

    test('should fail with negative price', async () => {
      const response = await request(app)
        .put(`/api/books/${testBook._id}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ price: -100 });

      expect(response.status).toBe(400);
    });

    test('should fail with invalid quality', async () => {
      const response = await request(app)
        .put(`/api/books/${testBook._id}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ quality: 'invalid' });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/books/:id', () => {
    let testBook;

    beforeEach(async () => {
      testBook = await Book.create(createTestBook(testSeller._id));
    });

    test('should delete book as owner successfully', async () => {
      const response = await request(app)
        .delete(`/api/books/${testBook._id}`)
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Book listing deleted successfully');

      // Verify book is deleted
      const deletedBook = await Book.findById(testBook._id);
      expect(deletedBook).toBeNull();
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/books/${testBook._id}`);

      expect(response.status).toBe(401);
    });

    test('should fail when not the owner', async () => {
      const anotherSeller = await User.create(createTestUser({
        email: 'another@test.com',
        userType: 'seller'
      }));
      const anotherToken = generateTestToken(anotherSeller._id, 'seller');

      const response = await request(app)
        .delete(`/api/books/${testBook._id}`)
        .set('Authorization', `Bearer ${anotherToken}`);

      expect(response.status).toBe(403);
    });

    test('should fail with buyer account', async () => {
      const response = await request(app)
        .delete(`/api/books/${testBook._id}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(403);
    });

    test('should fail with non-existent book id', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/books/${fakeId}`)
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/books/my/listings', () => {
    beforeEach(async () => {
      // Create books for test seller
      await Book.create(createTestBook(testSeller._id, { title: 'Book 1' }));
      await Book.create(createTestBook(testSeller._id, { title: 'Book 2' }));
      await Book.create(createTestBook(testSeller._id, { title: 'Book 3', status: 'sold' }));

      // Create book for another seller
      const anotherSeller = await User.create(createTestUser({
        email: 'another@test.com',
        userType: 'seller'
      }));
      await Book.create(createTestBook(anotherSeller._id, { title: 'Other Seller Book' }));
    });

    test('should get seller own listings successfully', async () => {
      const response = await request(app)
        .get('/api/books/my/listings')
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.books).toBeDefined();
      expect(response.body.books.length).toBe(3);
      expect(response.body.books.every(book => book.seller._id === testSeller._id.toString())).toBe(true);
    });

    test('should include all statuses', async () => {
      const response = await request(app)
        .get('/api/books/my/listings')
        .set('Authorization', `Bearer ${sellerToken}`);

      const statuses = response.body.books.map(book => book.status);
      expect(statuses).toContain('available');
      expect(statuses).toContain('sold');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/books/my/listings');

      expect(response.status).toBe(401);
    });

    test('should fail with buyer account', async () => {
      const response = await request(app)
        .get('/api/books/my/listings')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(403);
    });

    test('should return empty array for seller with no books', async () => {
      const newSeller = await User.create(createTestUser({
        email: 'newseller@test.com',
        userType: 'seller'
      }));
      const newToken = generateTestToken(newSeller._id, 'seller');

      const response = await request(app)
        .get('/api/books/my/listings')
        .set('Authorization', `Bearer ${newToken}`);

      expect(response.status).toBe(200);
      expect(response.body.books.length).toBe(0);
    });
  });

  describe('Book Status Management', () => {
    test('should update status when quantity reaches 0', async () => {
      const book = await Book.create(createTestBook(testSeller._id, {
        quantity: 1,
        status: 'available'
      }));

      // Update to 0 quantity
      await request(app)
        .put(`/api/books/${book._id}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ quantity: 0, status: 'sold' });

      const updatedBook = await Book.findById(book._id);
      expect(updatedBook.quantity).toBe(0);
      expect(updatedBook.status).toBe('sold');
    });

    test('should allow status changes', async () => {
      const book = await Book.create(createTestBook(testSeller._id));

      const statuses = ['available', 'reserved', 'sold', 'inactive'];

      for (const status of statuses) {
        const response = await request(app)
          .put(`/api/books/${book._id}`)
          .set('Authorization', `Bearer ${sellerToken}`)
          .send({ status });

        expect(response.status).toBe(200);
        expect(response.body.book.status).toBe(status);
      }
    });
  });
});
