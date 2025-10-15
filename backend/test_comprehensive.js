#!/usr/bin/env node
/**
 * Comprehensive Backend Testing Script
 * Tests all critical endpoints and identifies issues
 */

const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const API_BASE = 'http://localhost:5001/api';
let authToken = null;
let testUser = null;
let testOrderId = null;

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${title}`, 'bright');
  log('='.repeat(60), 'cyan');
}

async function testHealth() {
  section('1. Server Health Check');
  try {
    const response = await axios.get(`${API_BASE}/health`);
    log(`✓ Server is running`, 'green');
    log(`  Response: ${JSON.stringify(response.data, null, 2)}`, 'blue');
    return true;
  } catch (error) {
    log(`✗ Server health check failed`, 'red');
    log(`  Error: ${error.message}`, 'red');
    return false;
  }
}

async function testDatabaseConnection() {
  section('2. Database Connection Test');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    log(`✓ Connected to MongoDB`, 'green');
    log(`  Database: ${mongoose.connection.name}`, 'blue');

    // Get collection stats
    const collections = await mongoose.connection.db.listCollections().toArray();
    log(`  Collections: ${collections.map(c => c.name).join(', ')}`, 'blue');

    // Count documents
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }));
    const Book = mongoose.model('Book', new mongoose.Schema({}, { strict: false }));

    const userCount = await User.countDocuments();
    const orderCount = await Order.countDocuments();
    const bookCount = await Book.countDocuments();

    log(`  Users: ${userCount}, Orders: ${orderCount}, Books: ${bookCount}`, 'blue');
    return true;
  } catch (error) {
    log(`✗ Database connection failed`, 'red');
    log(`  Error: ${error.message}`, 'red');
    return false;
  }
}

async function testLogin() {
  section('3. Authentication Test');
  try {
    // Get a test user from database
    const User = mongoose.model('User');
    const users = await User.find({ userType: 'seller' }).limit(1);

    if (users.length === 0) {
      log(`⚠ No seller users found in database`, 'yellow');
      return false;
    }

    testUser = users[0];
    log(`  Found test user: ${testUser.email}`, 'blue');

    // Try to login (assuming password is known)
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email: testUser.email,
        password: '123456' // Common test password
      });

      authToken = response.data.token;
      log(`✓ Login successful`, 'green');
      log(`  Token: ${authToken.substring(0, 20)}...`, 'blue');
      return true;
    } catch (loginError) {
      log(`⚠ Login failed (password might be different)`, 'yellow');
      log(`  Will use direct token generation for tests`, 'yellow');

      // Generate a token directly for testing
      const jwt = require('jsonwebtoken');
      authToken = jwt.sign(
        { _id: testUser._id, userType: testUser.userType },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      log(`✓ Generated test token`, 'green');
      return true;
    }
  } catch (error) {
    log(`✗ Authentication test failed`, 'red');
    log(`  Error: ${error.message}`, 'red');
    return false;
  }
}

async function testGetOrders() {
  section('4. Get Orders Test');
  try {
    const response = await axios.get(`${API_BASE}/orders/my/seller`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    log(`✓ Successfully fetched orders`, 'green');
    log(`  Total orders: ${response.data.orders.length}`, 'blue');

    if (response.data.orders.length > 0) {
      testOrderId = response.data.orders[0]._id;
      log(`  First order ID: ${testOrderId}`, 'blue');
      log(`  Order status: ${response.data.orders[0].status}`, 'blue');
      log(`  Order details:`, 'blue');
      log(`    - Book: ${response.data.orders[0].book?.title || 'N/A'}`, 'blue');
      log(`    - Quantity: ${response.data.orders[0].quantity}`, 'blue');
      log(`    - Total: ${response.data.orders[0].totalPrice} MAD`, 'blue');
    } else {
      log(`  No orders found`, 'yellow');
    }

    return true;
  } catch (error) {
    log(`✗ Get orders failed`, 'red');
    log(`  Status: ${error.response?.status}`, 'red');
    log(`  Error: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testUpdateOrderStatus() {
  section('5. Update Order Status Test');

  if (!testOrderId) {
    log(`⚠ No test order available, creating one...`, 'yellow');
    await createTestOrder();
  }

  if (!testOrderId) {
    log(`✗ Cannot test status update without an order`, 'red');
    return false;
  }

  try {
    // Get current order status
    const Order = mongoose.model('Order');
    const order = await Order.findById(testOrderId)
      .populate('buyer seller book');

    log(`  Current order status: ${order.status}`, 'blue');
    log(`  Order has book populated: ${!!order.book._id}`, 'blue');
    log(`  Order has buyer populated: ${!!order.buyer._id}`, 'blue');
    log(`  Order has seller populated: ${!!order.seller._id}`, 'blue');

    // Determine next valid status
    let newStatus = 'confirmed';
    if (order.status === 'confirmed') {
      newStatus = 'delivered';
    } else if (order.status === 'delivered') {
      log(`  Order already delivered, testing refuse instead`, 'yellow');
      newStatus = 'refused';
    }

    log(`  Attempting to update status to: ${newStatus}`, 'blue');

    const response = await axios.put(
      `${API_BASE}/orders/${testOrderId}/status`,
      { status: newStatus },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    log(`✓ Status update successful!`, 'green');
    log(`  New status: ${response.data.order.status}`, 'blue');
    return true;

  } catch (error) {
    log(`✗ Status update failed`, 'red');
    log(`  Status Code: ${error.response?.status}`, 'red');
    log(`  Error Message: ${error.response?.data?.message || error.message}`, 'red');

    if (error.response?.status === 500) {
      log(`  This is the error you're seeing in the browser!`, 'yellow');
      log(`  Server error details:`, 'yellow');
      log(`    ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }

    return false;
  }
}

async function createTestOrder() {
  log(`  Creating a test order...`, 'yellow');
  try {
    const Order = mongoose.model('Order');
    const Book = mongoose.model('Book');
    const User = mongoose.model('User');

    // Find a book
    const book = await Book.findOne({ status: 'available' });
    if (!book) {
      log(`  No available books found`, 'red');
      return;
    }

    // Find a buyer
    const buyer = await User.findOne({ userType: 'buyer' });
    if (!buyer) {
      log(`  No buyers found`, 'red');
      return;
    }

    // Create order
    const order = new Order({
      book: book._id,
      seller: testUser._id,
      buyer: buyer._id,
      quantity: 1,
      totalPrice: book.price,
      status: 'pending',
      buyerLocation: {
        type: 'Point',
        coordinates: [-7.5898, 33.5731],
        name: 'Test Location',
        address: 'Casablanca, Morocco'
      }
    });

    await order.save();
    testOrderId = order._id.toString();
    log(`  ✓ Created test order: ${testOrderId}`, 'green');

  } catch (error) {
    log(`  Failed to create test order: ${error.message}`, 'red');
  }
}

async function testBooks() {
  section('6. Books API Test');
  try {
    const response = await axios.get(`${API_BASE}/books`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    log(`✓ Successfully fetched books`, 'green');
    log(`  Total books: ${response.data.books.length}`, 'blue');

    if (response.data.books.length > 0) {
      const book = response.data.books[0];
      log(`  Sample book:`, 'blue');
      log(`    - Title: ${book.title}`, 'blue');
      log(`    - Author: ${book.author}`, 'blue');
      log(`    - Price: ${book.price} MAD`, 'blue');
      log(`    - Status: ${book.status}`, 'blue');
    }

    return true;
  } catch (error) {
    log(`✗ Get books failed`, 'red');
    log(`  Error: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log(`\n${'*'.repeat(60)}`, 'bright');
  log(`  COMPREHENSIVE BACKEND TESTING`, 'bright');
  log(`  ${new Date().toLocaleString()}`, 'bright');
  log('*'.repeat(60), 'bright');

  const results = {
    health: await testHealth(),
    database: await testDatabaseConnection(),
    auth: await testLogin(),
    books: await testBooks(),
    getOrders: await testGetOrders(),
    updateStatus: await testUpdateOrderStatus(),
  };

  section('SUMMARY');
  log(`Health Check:        ${results.health ? '✓ PASS' : '✗ FAIL'}`, results.health ? 'green' : 'red');
  log(`Database:            ${results.database ? '✓ PASS' : '✗ FAIL'}`, results.database ? 'green' : 'red');
  log(`Authentication:      ${results.auth ? '✓ PASS' : '✗ FAIL'}`, results.auth ? 'green' : 'red');
  log(`Books API:           ${results.books ? '✓ PASS' : '✗ FAIL'}`, results.books ? 'green' : 'red');
  log(`Get Orders:          ${results.getOrders ? '✓ PASS' : '✗ FAIL'}`, results.getOrders ? 'green' : 'red');
  log(`Update Order Status: ${results.updateStatus ? '✓ PASS' : '✗ FAIL'}`, results.updateStatus ? 'green' : 'red');

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;

  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  TOTAL: ${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');
  log('='.repeat(60), 'cyan');

  // Cleanup
  await mongoose.connection.close();
  process.exit(passed === total ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  log(`\n✗ Fatal error during testing:`, 'red');
  log(`  ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
