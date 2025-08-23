const express = require('express');
const Book = require('../models/Book');
const { auth, requireBuyer, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/books
// @desc    Get all available books (with optional search and filters)
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      search,
      category,
      quality,
      minPrice,
      maxPrice,
      author,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = { status: 'available' };

    // Search in title and author
    if (search) {
      query.$text = { $search: search };
    }

    // Filters
    if (category) query.category = new RegExp(category, 'i');
    if (quality) query.quality = quality;
    if (author) query.author = new RegExp(author, 'i');

    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const books = await Book.find(query)
      .populate('buyer', 'profile location phone')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Book.countDocuments(query);

    res.json({
      books,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: skip + books.length < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({
      message: 'Server error getting books',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/books/:id
// @desc    Get single book by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('buyer', 'profile location phone');

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Increment view count if not the owner
    if (!req.user || book.buyer._id.toString() !== req.user._id.toString()) {
      book.views += 1;
      await book.save();
    }

    res.json({ book });

  } catch (error) {
    console.error('Get book error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.status(500).json({
      message: 'Server error getting book',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/books
// @desc    Create new book listing
// @access  Private (Buyers only)
router.post('/', auth, requireBuyer, async (req, res) => {
  try {
    const {
      title,
      author,
      quality,
      quantity,
      price,
      description,
      category,
      isbn,
      condition
    } = req.body;

    // Validation
    if (!title || !author || !quality || !quantity || !price) {
      return res.status(400).json({
        message: 'Please provide all required fields: title, author, quality, quantity, price'
      });
    }

    if (!['excellent', 'good', 'fair', 'poor'].includes(quality)) {
      return res.status(400).json({
        message: 'Quality must be one of: excellent, good, fair, poor'
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        message: 'Quantity must be at least 1'
      });
    }

    if (price < 0) {
      return res.status(400).json({
        message: 'Price cannot be negative'
      });
    }

    // Create book
    const book = new Book({
      title,
      author,
      quality,
      quantity: parseInt(quantity),
      price: parseFloat(price),
      description,
      category,
      isbn,
      condition,
      buyer: req.user._id
    });

    await book.save();
    await book.populate('buyer', 'profile location phone');

    res.status(201).json({
      message: 'Book listed successfully',
      book
    });

  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({
      message: 'Server error creating book listing',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/books/:id
// @desc    Update book listing
// @access  Private (Book owner only)
router.put('/:id', auth, requireBuyer, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Check ownership
    if (book.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this book' });
    }

    const {
      title,
      author,
      quality,
      quantity,
      price,
      description,
      category,
      isbn,
      condition,
      status
    } = req.body;

    // Update fields if provided
    if (title) book.title = title;
    if (author) book.author = author;
    if (quality && ['excellent', 'good', 'fair', 'poor'].includes(quality)) {
      book.quality = quality;
    }
    if (quantity && quantity >= 1) book.quantity = parseInt(quantity);
    if (price !== undefined && price >= 0) book.price = parseFloat(price);
    if (description !== undefined) book.description = description;
    if (category) book.category = category;
    if (isbn) book.isbn = isbn;
    if (condition) book.condition = condition;
    if (status && ['available', 'reserved', 'sold', 'inactive'].includes(status)) {
      book.status = status;
    }

    await book.save();
    await book.populate('buyer', 'profile location phone');

    res.json({
      message: 'Book updated successfully',
      book
    });

  } catch (error) {
    console.error('Update book error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.status(500).json({
      message: 'Server error updating book',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/books/:id
// @desc    Delete book listing
// @access  Private (Book owner only)
router.delete('/:id', auth, requireBuyer, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Check ownership
    if (book.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this book' });
    }

    await Book.findByIdAndDelete(req.params.id);

    res.json({ message: 'Book listing deleted successfully' });

  } catch (error) {
    console.error('Delete book error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.status(500).json({
      message: 'Server error deleting book',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/books/my/listings
// @desc    Get current buyer's book listings
// @access  Private (Buyers only)
router.get('/my/listings', auth, requireBuyer, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let query = { buyer: req.user._id };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const books = await Book.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Book.countDocuments(query);

    res.json({
      books,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: skip + books.length < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get my listings error:', error);
    res.status(500).json({
      message: 'Server error getting your listings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
