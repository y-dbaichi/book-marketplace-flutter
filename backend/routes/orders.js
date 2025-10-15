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

    console.log(`📦 Status update request for order ${req.params.id}:`, {
      requestedStatus: status,
      userId: req.user._id,
      userType: req.user.userType
    });

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

    console.log(`📋 Current order status: ${order.status}, Requested status: ${status}`);

    // Check if user is part of this order
    const isBuyer = order.buyer._id.toString() === req.user._id.toString();
    const isSeller = order.seller._id.toString() === req.user._id.toString();

    console.log(`🔐 Authorization check:`, {
      isBuyer,
      isSeller,
      buyerId: order.buyer._id.toString(),
      sellerId: order.seller._id.toString(),
      userId: req.user._id.toString()
    });

    if (!isBuyer && !isSeller) {
      console.log('❌ Authorization failed: User not part of order');
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
      console.log(`👨‍💼 Seller transition check:`, {
        currentStatus,
        requestedStatus: status,
        allowed: sellerTransitions[currentStatus],
        canUpdate
      });
    }

    if (isBuyer) {
      const buyerTransitions = {
        'pending': ['refused'],
        'confirmed': ['refused']
      };
      const buyerCanUpdate = buyerTransitions[currentStatus]?.includes(status);
      canUpdate = canUpdate || buyerCanUpdate;
      console.log(`👨‍💼 Buyer transition check:`, {
        currentStatus,
        requestedStatus: status,
        allowed: buyerTransitions[currentStatus],
        buyerCanUpdate,
        finalCanUpdate: canUpdate
      });
    }

    if (!canUpdate) {
      console.log(`❌ Transition validation failed: Cannot change from ${currentStatus} to ${status}`);
      return res.status(400).json({
        message: `Cannot change status from ${currentStatus} to ${status}`
      });
    }

    // Handle inventory management for status changes
    const previousStatus = order.status;

    // CONFIRM ORDER: Decrement book stock
    if (status === 'confirmed' && previousStatus === 'pending' && !order.inventoryUpdated) {
      // Get book ID (handle both populated and non-populated cases)
      const bookId = order.book._id || order.book;
      const book = await Book.findById(bookId);

      console.log(`📚 Inventory check:`, {
        bookId: bookId.toString(),
        currentStock: book?.quantity,
        orderQuantity: order.quantity,
        available: book ? (book.quantity >= order.quantity) : false
      });

      if (!book) {
        console.log('❌ Book not found');
        return res.status(404).json({ message: 'Book not found' });
      }

      // Check if enough stock is available
      if (book.quantity < order.quantity) {
        console.log(`❌ Insufficient stock: need ${order.quantity}, have ${book.quantity}`);
        return res.status(400).json({
          message: `Insufficient stock. Only ${book.quantity} copies available, but order requires ${order.quantity}`
        });
      }

      console.log(`✅ Stock check passed, updating inventory`);

      // Decrement stock
      book.quantity -= order.quantity;

      // Mark as sold if quantity reaches 0
      if (book.quantity === 0) {
        book.status = 'sold';
      }

      await book.save();
      order.inventoryUpdated = true;

      // Auto-refuse other pending orders if stock is now insufficient
      if (book.quantity === 0 || book.status === 'sold') {
        const pendingOrders = await Order.find({
          book: bookId,
          status: 'pending',
          _id: { $ne: order._id } // Exclude current order
        });

        if (pendingOrders.length > 0) {
          console.log(`🔄 Auto-refusing ${pendingOrders.length} pending orders due to sold-out stock`);

          for (const pendingOrder of pendingOrders) {
            pendingOrder.status = 'refused';
            pendingOrder.sellerNotes = `Book is sold out. This order was automatically refused because all stock has been allocated to other confirmed orders.`;
            await pendingOrder.save();
          }

          console.log(`✅ Auto-refused ${pendingOrders.length} orders for sold-out book`);
        }
      } else if (book.quantity > 0) {
        // Check if there are pending orders that exceed remaining stock
        const pendingOrders = await Order.find({
          book: bookId,
          status: 'pending',
          _id: { $ne: order._id }
        }).sort({ createdAt: 1 }); // First-come-first-served

        if (pendingOrders.length > 0) {
          for (const pendingOrder of pendingOrders) {
            if (pendingOrder.quantity > book.quantity) {
              pendingOrder.status = 'refused';
              pendingOrder.sellerNotes = `Insufficient stock available. Only ${book.quantity} copies remain, but this order requires ${pendingOrder.quantity}. Order automatically refused.`;
              await pendingOrder.save();
              console.log(`⚠️ Auto-refused order ${pendingOrder._id} - needs ${pendingOrder.quantity}, only ${book.quantity} available`);
            }
          }
        }
      }
    }

    // REFUSE ORDER: Restore stock if it was previously confirmed
    if (status === 'refused' && previousStatus === 'confirmed' && order.inventoryUpdated) {
      // Get book ID (handle both populated and non-populated cases)
      const bookId = order.book._id || order.book;
      const book = await Book.findById(bookId);

      if (book) {
        // Restore stock
        book.quantity += order.quantity;

        // Mark as available again if it was sold
        if (book.status === 'sold') {
          book.status = 'available';
        }

        await book.save();
        order.inventoryUpdated = false;
      }
    }

    // Update order status
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
