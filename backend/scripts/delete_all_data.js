require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Book = require('../models/Book');

async function deleteAllData() {
  try {
    console.log('🔗 Connecting to MongoDB...\n');
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('⚠️  WARNING: This will DELETE ALL orders and books!');
    console.log('=' .repeat(60));
    
    // Count current data
    const orderCount = await Order.countDocuments();
    const bookCount = await Book.countDocuments();
    
    console.log(`\n📊 Current Data:`);
    console.log(`   📦 Orders: ${orderCount}`);
    console.log(`   📚 Books: ${bookCount}`);
    console.log('');
    
    if (orderCount === 0 && bookCount === 0) {
      console.log('✅ Database is already empty!');
      process.exit(0);
    }
    
    // Check if --confirm flag was passed
    if (!process.argv.includes('--confirm')) {
      console.log('⚠️  To proceed with deletion, run:');
      console.log('   node scripts/delete_all_data.js --confirm\n');
      process.exit(0);
    }
    
    console.log('🗑️  Deleting all data...\n');
    
    // Delete orders
    console.log('   Deleting orders...');
    const ordersResult = await Order.deleteMany({});
    console.log(`   ✅ Deleted ${ordersResult.deletedCount} orders`);
    
    // Delete books
    console.log('   Deleting books...');
    const booksResult = await Book.deleteMany({});
    console.log(`   ✅ Deleted ${booksResult.deletedCount} books`);
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 SUCCESS! All orders and books have been deleted.');
    console.log('=' .repeat(60));
    
    // Verify deletion
    const remainingOrders = await Order.countDocuments();
    const remainingBooks = await Book.countDocuments();
    
    console.log(`\n📊 Remaining Data:`);
    console.log(`   📦 Orders: ${remainingOrders}`);
    console.log(`   📚 Books: ${remainingBooks}`);
    
    if (remainingOrders === 0 && remainingBooks === 0) {
      console.log('\n✅ Database is now clean!\n');
    } else {
      console.log('\n⚠️  Some data still remains. Check manually.\n');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteAllData();
