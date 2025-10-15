/**
 * Unit Tests for Book Model
 */

const mongoose = require('mongoose');
const Book = require('../../../models/Book');
const User = require('../../../models/User');
const { setupTestDB, clearTestDB, closeTestDB, createTestUser, createTestBook } = require('../../setup');

describe('Book Model Unit Tests', () => {
  let testSeller;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Create a test seller
    const User = mongoose.model('User');
    testSeller = await User.create(createTestUser({
      email: 'seller@test.com',
      userType: 'seller'
    }));
  });

  describe('Book Creation', () => {
    test('should create a valid book', async () => {
      const bookData = createTestBook(testSeller._id);
      const book = await Book.create(bookData);

      expect(book).toBeDefined();
      expect(book._id).toBeDefined();
      expect(book.title).toBe('Test Book');
      expect(book.author).toBe('Test Author');
      expect(book.quantity).toBe(5);
      expect(book.price).toBe(100);
      expect(book.status).toBe('available');
    });

    test('should fail without required fields', async () => {
      const invalidBook = {
        title: 'Test Book'
        // Missing required fields
      };

      await expect(Book.create(invalidBook)).rejects.toThrow();
    });

    test('should default status to available', async () => {
      const bookData = createTestBook(testSeller._id);
      delete bookData.status;

      const book = await Book.create(bookData);
      expect(book.status).toBe('available');
    });

    test('should allow quantity of 0 (sold out)', async () => {
      const bookData = createTestBook(testSeller._id, { quantity: 0 });
      const book = await Book.create(bookData);

      expect(book.quantity).toBe(0);
    });

    test('should reject negative quantity', async () => {
      const bookData = createTestBook(testSeller._id, { quantity: -1 });

      await expect(Book.create(bookData)).rejects.toThrow();
    });

    test('should validate quality enum', async () => {
      const bookData = createTestBook(testSeller._id, { quality: 'invalid' });

      await expect(Book.create(bookData)).rejects.toThrow();
    });

    test('should accept valid quality values', async () => {
      const qualities = ['excellent', 'good', 'fair', 'poor'];

      for (const quality of qualities) {
        const bookData = createTestBook(testSeller._id, {
          quality,
          title: `Book ${quality}`
        });
        const book = await Book.create(bookData);
        expect(book.quality).toBe(quality);
      }
    });
  });

  describe('Book Status', () => {
    test('should validate status enum', async () => {
      const bookData = createTestBook(testSeller._id, { status: 'invalid' });

      await expect(Book.create(bookData)).rejects.toThrow();
    });

    test('should accept all valid statuses', async () => {
      const statuses = ['available', 'reserved', 'sold', 'inactive'];

      for (const status of statuses) {
        const bookData = createTestBook(testSeller._id, {
          status,
          title: `Book ${status}`
        });
        const book = await Book.create(bookData);
        expect(book.status).toBe(status);
      }
    });

    test('should update status when quantity reaches 0', async () => {
      const book = await Book.create(createTestBook(testSeller._id, { quantity: 1 }));

      book.quantity = 0;
      book.status = 'sold';
      await book.save();

      expect(book.quantity).toBe(0);
      expect(book.status).toBe('sold');
    });
  });

  describe('Book Condition', () => {
    test('should default condition flags to false', async () => {
      const bookData = createTestBook(testSeller._id);
      delete bookData.condition;

      const book = await Book.create(bookData);

      expect(book.condition.hasWriting).toBe(false);
      expect(book.condition.hasHighlighting).toBe(false);
      expect(book.condition.hasDamage).toBe(false);
    });

    test('should accept custom condition values', async () => {
      const bookData = createTestBook(testSeller._id, {
        condition: {
          hasWriting: true,
          hasHighlighting: true,
          hasDamage: true,
          damageDescription: 'Cover torn'
        }
      });

      const book = await Book.create(bookData);

      expect(book.condition.hasWriting).toBe(true);
      expect(book.condition.hasHighlighting).toBe(true);
      expect(book.condition.hasDamage).toBe(true);
      expect(book.condition.damageDescription).toBe('Cover torn');
    });
  });

  describe('Book Validation', () => {
    test('should enforce maximum title length', async () => {
      const longTitle = 'A'.repeat(201);
      const bookData = createTestBook(testSeller._id, { title: longTitle });

      await expect(Book.create(bookData)).rejects.toThrow();
    });

    test('should enforce maximum author length', async () => {
      const longAuthor = 'A'.repeat(101);
      const bookData = createTestBook(testSeller._id, { author: longAuthor });

      await expect(Book.create(bookData)).rejects.toThrow();
    });

    test('should trim whitespace from strings', async () => {
      const bookData = createTestBook(testSeller._id, {
        title: '  Test Book  ',
        author: '  Test Author  ',
        category: '  Fiction  '
      });

      const book = await Book.create(bookData);

      expect(book.title).toBe('Test Book');
      expect(book.author).toBe('Test Author');
      expect(book.category).toBe('Fiction');
    });

    test('should require positive price', async () => {
      const bookData = createTestBook(testSeller._id, { price: -10 });

      await expect(Book.create(bookData)).rejects.toThrow();
    });

    test('should allow price of 0', async () => {
      const bookData = createTestBook(testSeller._id, { price: 0 });
      const book = await Book.create(bookData);

      expect(book.price).toBe(0);
    });
  });

  describe('Book Seller Reference', () => {
    test('should require seller reference', async () => {
      const bookData = createTestBook(testSeller._id);
      delete bookData.seller;

      await expect(Book.create(bookData)).rejects.toThrow();
    });

    test('should populate seller correctly', async () => {
      const book = await Book.create(createTestBook(testSeller._id));
      const populatedBook = await Book.findById(book._id).populate('seller');

      expect(populatedBook.seller._id.toString()).toBe(testSeller._id.toString());
      expect(populatedBook.seller.email).toBe('seller@test.com');
    });
  });

  describe('Book Timestamps', () => {
    test('should automatically add createdAt and updatedAt', async () => {
      const book = await Book.create(createTestBook(testSeller._id));

      expect(book.createdAt).toBeDefined();
      expect(book.updatedAt).toBeDefined();
    });

    test('should update updatedAt on modification', async () => {
      const book = await Book.create(createTestBook(testSeller._id));
      const originalUpdatedAt = book.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 100));

      book.price = 150;
      await book.save();

      expect(book.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});
