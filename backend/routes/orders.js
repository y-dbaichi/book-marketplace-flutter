const express = require('express');
const Order = require('../models/Order');
const Book = require('../models/Book');
const { auth, requireCustomer, requireBuyer } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/orders
// @desc    Create new order
// @access  Private (Customers only)
router.post('/', auth, requireCustomer, async (req, res) => {
  try {
    const { bookId, quantity, orderType, customerNotes } = req.body;

    // Validation
    if (!bookId || !quantity || !orderType) {
      return res.status(400).json({
        message: 'Please provide bookId, quantity, and orderType'
      });
    }

    if (!['pickup', 'delivery'].includes(orderType)) {
      return res.status(400).json({
        message: 'orderType must be either "pickup" or "delivery"'
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        message: 'Quantity must be at least 1'
      });
    }

    // Find the book
    const book = await Book.findById(bookId).populate('buyer');
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (book.status !== 'available') {
      return res.status(400).json({ message: 'Book is not available for order' });
    }

    if (book.quantity < quantity) {
      return res.status(400).json({
        message: `Only ${book.quantity} copies available`
      });
    }

    // Check if customer is trying to order their own book
    if (book.buyer._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        message: 'You cannot order your own book'
      });
    }

    // Calculate total price
    const totalPrice = book.price * quantity;

    // Create order
    const order = new Order({
      customer: req.user._id,
      buyer: book.buyer._id,
      book: bookId,
      quantity,
      totalPrice,
      orderType,
      customerNotes,
      // Optionally set locations for pickup/delivery
      locations: {
        buyerLocation: book.buyer.location || undefined,
        // You can add customerLocation if needed, e.g. from req.user.location
      }
    });

    await order.save();
    
    // Populate order data
    await order.populate([
      { path: 'customer', select: 'profile phone location' },
      { path: 'buyer', select: 'profile phone location' },
      {
        path: 'book',
        select: 'title author price buyer',
        populate: [
          { path: 'buyer', select: 'profile phone location' }
        ]
      }
    ]);

    res.status(201).json({
      message: 'Order created successfully',
      order
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      message: 'Server error creating order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/orders/my/customer
// @desc    Get customer's orders
// @access  Private (Customers only)
router.get('/my/customer', auth, requireCustomer, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let query = { customer: req.user._id };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate('buyer', 'profile phone location')
      .populate({
        path: 'book',
        select: 'title author price buyer',
        populate: [
          { path: 'buyer', select: 'profile phone location' }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: skip + orders.length < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get customer orders error:', error);
    res.status(500).json({
      message: 'Server error getting your orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/orders/my/buyer
// @desc    Get buyer's received orders
// @access  Private (Buyers only)
router.get('/my/buyer', auth, requireBuyer, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let query = { buyer: req.user._id };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate('customer', 'profile phone location')
      .populate({
        path: 'book',
        select: 'title author price buyer',
        populate: [
          { path: 'buyer', select: 'profile phone location' }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: skip + orders.length < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get buyer orders error:', error);
    res.status(500).json({
      message: 'Server error getting received orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private (Order participants only)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const validStatuses = [
      'pending', 'confirmed', 'preparing', 'ready', 
      'in_transit', 'completed', 'cancelled', 'disputed'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findById(req.params.id)
      .populate('customer', 'profile phone')
      .populate('buyer', 'profile phone')
      .populate('book', 'title author');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is part of this order
    const isCustomer = order.customer._id.toString() === req.user._id.toString();
    const isBuyer = order.buyer._id.toString() === req.user._id.toString();

    if (!isCustomer && !isBuyer) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    // Status transition validation
    const currentStatus = order.status;
    let canUpdate = false;

    // Define allowed transitions based on user role
    if (isBuyer) {
      const buyerTransitions = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['preparing', 'cancelled'],
        'preparing': ['ready', 'cancelled'],
        'ready': ['in_transit', 'completed', 'cancelled'],
        'in_transit': ['completed', 'disputed']
      };
      canUpdate = buyerTransitions[currentStatus]?.includes(status);
    }

    if (isCustomer) {
      const customerTransitions = {
        'pending': ['cancelled'],
        'confirmed': ['cancelled'],
        'preparing': ['cancelled'],
        'ready': ['cancelled'],
        'in_transit': ['completed', 'disputed'],
        'completed': ['disputed']
      };
      canUpdate = canUpdate || customerTransitions[currentStatus]?.includes(status);
    }

    if (!canUpdate) {
      return res.status(400).json({
        message: `Cannot change status from ${currentStatus} to ${status}`
      });
    }

    // Update order
    order.status = status;
    
    // Update timestamps
    const now = new Date();
    switch (status) {
      case 'confirmed':
        order.timestamps.confirmed = now;
        break;
      case 'ready':
        order.timestamps.ready = now;
        break;
      case 'completed':
        order.timestamps.completed = now;
        break;
      case 'cancelled':
        order.timestamps.cancelled = now;
        break;
    }

    // Add notes
    if (notes) {
      if (isBuyer) {
        order.buyerNotes = notes;
      } else {
        order.customerNotes = notes;
      }
    }

    await order.save();

    res.json({
      message: 'Order status updated successfully',
      order
    });

  } catch (error) {
    console.error('Update order status error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(500).json({
      message: 'Server error updating order status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
