const express = require('express');
const Order = require('../models/Order');
const Book = require('../models/Book');
const { auth, requireBuyer, requireSeller } = require('../middleware/auth');

const router = express.Router();

// Helper function to simplify order response
const simplifyOrderResponse = (order) => {
  const obj = order.toObject ? order.toObject() : order;
  return {
    ...obj,
    location: obj.buyerLocation || null
  };
};

// @route   POST /api/orders
// @desc    Create new order
// @access  Private (Buyers only)
// POST /api/orders
// POST /api/orders
router.post('/', auth, requireBuyer, async (req, res) => {
  try {
    const { bookId, quantity, orderType, buyerNotes, location } = req.body;

    if (!bookId || !quantity || !orderType) {
      return res.status(400).json({ message: 'Please provide bookId, quantity, and orderType' });
    }
    if (!['pickup', 'delivery'].includes(orderType)) {
      return res.status(400).json({ message: 'orderType must be either "pickup" or "delivery"' });
    }
    if (quantity < 1) return res.status(400).json({ message: 'Quantity must be at least 1' });

    const book = await Book.findById(bookId).populate('seller', 'profile location');
    if (!book) return res.status(404).json({ message: 'Book not found' });
    if (book.status !== 'available') return res.status(400).json({ message: 'Book is not available for order' });
    if (book.quantity < quantity) return res.status(400).json({ message: `Only ${book.quantity} copies available` });
    if (!book.seller) return res.status(400).json({ message: 'Book has no seller assigned' });
    if (book.seller._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot order your own book' });
    }

    const normalizeLoc = (loc) => {
      if (!loc) return undefined;
      const out = {
        name: loc.name || 'Buyer Address',
        address: (loc.address || '').trim() || undefined,
      };
      // keep your User-style coordinates {latitude, longitude}
      if (loc.coordinates?.latitude != null && loc.coordinates?.longitude != null) {
        out.coordinates = {
          latitude: Number(loc.coordinates.latitude),
          longitude: Number(loc.coordinates.longitude),
        };
      }
      // also accept lat/lng for convenience
      if (loc.lat != null && loc.lng != null) {
        out.coordinates = { latitude: Number(loc.lat), longitude: Number(loc.lng) };
      }
      return out;
    };

    const totalPrice = Number(book.price) * Number(quantity);

    // Single canonical destination for the order = buyer's location
    const singleLocation = normalizeLoc(location) || normalizeLoc(req.user.location);

    // Transform location to GeoJSON format for the Order model
    const transformToGeoJSON = (loc) => {
      if (!loc || !loc.coordinates) return undefined;
      return {
        type: 'Point',
        coordinates: [loc.coordinates.longitude, loc.coordinates.latitude],
        name: loc.name,
        address: loc.address
      };
    };

    const order = new Order({
      buyer: req.user._id,
      seller: book.seller._id,
      book: bookId,
      quantity,
      totalPrice,
      orderType,
      buyerNotes,
      sellerLocation: transformToGeoJSON(book.seller.location),
      buyerLocation: transformToGeoJSON(singleLocation),
      status: 'pending',
    });

    await order.save();

    await order.populate([
      { path: 'buyer', select: 'profile phone location' },
      { path: 'seller', select: 'profile phone location' },
      { path: 'book', select: 'title author price seller', populate: [{ path: 'seller', select: 'profile phone location' }] }
    ]);

    return res.status(201).json({ message: 'Order created successfully', order: simplifyOrderResponse(order) });
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ message: 'Server error creating order' });
  }
});



// @route   GET /api/orders/my/buyer
// @desc    Get buyer's orders
// @access  Private (Buyers only)
router.get('/my/buyer', auth, requireBuyer, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let query = { buyer: req.user._id };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate('seller', 'profile phone location')
      .populate({
        path: 'book',
        select: 'title author price seller',
        populate: [
          { path: 'seller', select: 'profile phone location' }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      orders: orders.map(simplifyOrderResponse),
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
      message: 'Server error getting your orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/orders/my/seller
// @desc    Get seller's received orders
// @access  Private (Sellers only)
router.get('/my/seller', auth, requireSeller, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let query = { seller: req.user._id };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate('buyer', 'profile phone location')
      .populate({
        path: 'book',
        select: 'title author price seller',
        populate: [
          { path: 'seller', select: 'profile phone location' }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      orders: orders.map(simplifyOrderResponse),
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: skip + orders.length < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get seller orders error:', error);
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

    const validStatuses = ['pending', 'confirmed', 'delivered', 'refused'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findById(req.params.id)
      .populate('buyer', 'profile phone')
      .populate('seller', 'profile phone')
      .populate('book', 'title author');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is part of this order
    const isBuyer = order.buyer._id.toString() === req.user._id.toString();
    const isSeller = order.seller._id.toString() === req.user._id.toString();

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    // Status transition validation
    const currentStatus = order.status;
    let canUpdate = false;

    // Define allowed transitions based on user role
    if (isSeller) {
      const sellerTransitions = {
        'pending': ['confirmed', 'refused'],
        'confirmed': ['delivered', 'refused']
      };
      canUpdate = sellerTransitions[currentStatus]?.includes(status);
    }

    if (isBuyer) {
      const buyerTransitions = {
        'pending': ['refused'],
        'confirmed': ['refused']
      };
      canUpdate = canUpdate || buyerTransitions[currentStatus]?.includes(status);
    }

    if (!canUpdate) {
      return res.status(400).json({
        message: `Cannot change status from ${currentStatus} to ${status}`
      });
    }

    // Update order
    order.status = status;

    // Add notes
    if (notes) {
      if (isSeller) {
        order.sellerNotes = notes;
      } else {
        order.buyerNotes = notes;
      }
    }

    await order.save();

    res.json({
      message: 'Order status updated successfully',
      order: simplifyOrderResponse(order)
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
