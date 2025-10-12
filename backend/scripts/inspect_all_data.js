require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Book = require('../models/Book');
const Order = require('../models/Order');
const GeoJSONExport = require('../models/GeoJSONExport');

async function inspectAllData() {
  try {
    console.log('🔗 Connecting to MongoDB...\n');
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('═'.repeat(70));
    console.log('📊 DATABASE INSPECTION REPORT');
    console.log('═'.repeat(70));
    console.log('');
    
    // ========== USERS ==========
    console.log('👥 USERS');
    console.log('─'.repeat(70));
    
    const users = await User.find().lean();
    console.log(`Total Users: ${users.length}\n`);
    
    if (users.length > 0) {
      const usersByType = users.reduce((acc, user) => {
        acc[user.userType] = (acc[user.userType] || 0) + 1;
        return acc;
      }, {});
      
      console.log('By Type:');
      Object.entries(usersByType).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });
      
      console.log('\nUser Details:');
      users.forEach((user, i) => {
        console.log(`\n   ${i + 1}. ${user.email || 'No Email'}`);
        console.log(`      Type: ${user.userType || 'N/A'}`);
        console.log(`      Name: ${user.displayName || user.profile?.firstName || 'N/A'}`);
        console.log(`      ID: ${user._id}`);
        if (user.location) {
          console.log(`      Location: ${user.location.name || user.location.address || 'N/A'}`);
        }
        console.log(`      Created: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}`);
      });
    } else {
      console.log('   ℹ️  No users found');
    }
    
    console.log('\n');
    
    // ========== BOOKS ==========
    console.log('📚 BOOKS');
    console.log('─'.repeat(70));
    
    const books = await Book.find().populate('seller', 'email displayName').lean();
    console.log(`Total Books: ${books.length}\n`);
    
    if (books.length > 0) {
      const booksByStatus = books.reduce((acc, book) => {
        acc[book.status] = (acc[book.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('By Status:');
      Object.entries(booksByStatus).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
      
      const totalValue = books.reduce((sum, book) => sum + (book.price * book.quantity || 0), 0);
      const totalQuantity = books.reduce((sum, book) => sum + (book.quantity || 0), 0);
      
      console.log('\nInventory:');
      console.log(`   Total Quantity: ${totalQuantity} books`);
      console.log(`   Total Value: ${totalValue.toFixed(2)} MAD`);
      
      console.log('\nBook Details:');
      books.slice(0, 10).forEach((book, i) => {
        console.log(`\n   ${i + 1}. "${book.title}" by ${book.author}`);
        console.log(`      Price: ${book.price} MAD | Qty: ${book.quantity} | Status: ${book.status}`);
        console.log(`      Seller: ${book.seller?.email || book.seller?.displayName || 'Unknown'}`);
        console.log(`      Category: ${book.category || 'N/A'} | Quality: ${book.quality}`);
        console.log(`      ID: ${book._id}`);
      });
      
      if (books.length > 10) {
        console.log(`\n   ... and ${books.length - 10} more books`);
      }
    } else {
      console.log('   ℹ️  No books found');
    }
    
    console.log('\n');
    
    // ========== ORDERS ==========
    console.log('📦 ORDERS');
    console.log('─'.repeat(70));
    
    const orders = await Order.find()
      .populate('buyer', 'email displayName')
      .populate('seller', 'email displayName')
      .populate('book', 'title author price')
      .lean();
    
    console.log(`Total Orders: ${orders.length}\n`);
    
    if (orders.length > 0) {
      const ordersByStatus = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('By Status:');
      Object.entries(ordersByStatus).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
      
      const totalRevenue = orders
        .filter(o => ['confirmed', 'delivered'].includes(o.status))
        .reduce((sum, order) => sum + (order.totalPrice || 0), 0);
      
      const pendingRevenue = orders
        .filter(o => o.status === 'pending')
        .reduce((sum, order) => sum + (order.totalPrice || 0), 0);
      
      console.log('\nFinancials:');
      console.log(`   Confirmed/Delivered Revenue: ${totalRevenue.toFixed(2)} MAD`);
      console.log(`   Pending Revenue: ${pendingRevenue.toFixed(2)} MAD`);
      
      console.log('\nOrder Details:');
      orders.slice(0, 10).forEach((order, i) => {
        console.log(`\n   ${i + 1}. Order #${order._id.toString().slice(-6)}`);
        console.log(`      Book: ${order.book?.title || 'N/A'} by ${order.book?.author || 'N/A'}`);
        console.log(`      Buyer: ${order.buyer?.email || order.buyer?.displayName || 'N/A'}`);
        console.log(`      Seller: ${order.seller?.email || order.seller?.displayName || 'N/A'}`);
        console.log(`      Status: ${order.status} | Qty: ${order.quantity} | Total: ${order.totalPrice} MAD`);

        const location = order.locations?.buyerLocation || order.buyerLocation;
        if (location) {
          console.log(`      Location: ${location.name || location.address || 'N/A'}`);
          if (location.address) console.log(`      Address: ${location.address}`);
        } else {
          console.log(`      Location: N/A`);
        }

        console.log(`      Created: ${new Date(order.createdAt).toLocaleString()}`);
      });
      
      if (orders.length > 10) {
        console.log(`\n   ... and ${orders.length - 10} more orders`);
      }
    } else {
      console.log('   ℹ️  No orders found');
    }
    
    console.log('\n');
    
    // ========== GEOJSON EXPORTS ==========
    console.log('🗺️  GEOJSON EXPORTS');
    console.log('─'.repeat(70));
    
    const exports = await GeoJSONExport.find()
      .populate('user', 'email displayName')
      .lean();
    
    console.log(`Total Exports: ${exports.length}\n`);
    
    if (exports.length > 0) {
      const exportsByStatus = exports.reduce((acc, exp) => {
        acc[exp.status] = (acc[exp.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('By Status:');
      Object.entries(exportsByStatus).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
      
      const exportsByType = exports.reduce((acc, exp) => {
        acc[exp.exportType] = (acc[exp.exportType] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\nBy Type:');
      Object.entries(exportsByType).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });
      
      console.log('\nExport Details:');
      exports.slice(0, 5).forEach((exp, i) => {
        console.log(`\n   ${i + 1}. ${exp.fileName}`);
        console.log(`      User: ${exp.user?.email || exp.user?.displayName || 'N/A'}`);
        console.log(`      Type: ${exp.exportType} | Status: ${exp.status}`);
        console.log(`      Features: ${exp.geoJSONData?.features?.length || 0}`);
        console.log(`      Size: ${(exp.fileSize / 1024).toFixed(2)} KB`);
        console.log(`      Downloads: ${exp.downloadCount}`);
        console.log(`      Created: ${new Date(exp.createdAt).toLocaleString()}`);
        console.log(`      Expires: ${new Date(exp.expiresAt).toLocaleString()}`);
      });
      
      if (exports.length > 5) {
        console.log(`\n   ... and ${exports.length - 5} more exports`);
      }
    } else {
      console.log('   ℹ️  No exports found');
    }
    
    console.log('\n');
    
    // ========== SUMMARY ==========
    console.log('═'.repeat(70));
    console.log('📊 SUMMARY');
    console.log('═'.repeat(70));
    console.log('');
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   📚 Books: ${books.length}`);
    console.log(`   📦 Orders: ${orders.length}`);
    console.log(`   🗺️  Exports: ${exports.length}`);
    console.log('');
    
    // Data quality checks
    console.log('🔍 DATA QUALITY CHECKS:');
    console.log('─'.repeat(70));
    
    const ordersWithoutLocation = orders.filter(o =>
      !o.locations?.buyerLocation && !o.buyerLocation
    ).length;

    const ordersWithLocation = orders.filter(o =>
      o.locations?.buyerLocation || o.buyerLocation
    ).length;

    console.log(`   ✅ Orders with location: ${ordersWithLocation}`);
    console.log(`   ⚠️  Orders without location: ${ordersWithoutLocation}`);

    const booksWithoutSeller = books.filter(b => !b.seller).length;
    console.log(`   ${booksWithoutSeller === 0 ? '✅' : '⚠️'}  Books without seller: ${booksWithoutSeller}`);
    
    const ordersWithoutBook = orders.filter(o => !o.book).length;
    console.log(`   ${ordersWithoutBook === 0 ? '✅' : '⚠️'}  Orders without book: ${ordersWithoutBook}`);
    
    console.log('');
    console.log('═'.repeat(70));
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

inspectAllData();
