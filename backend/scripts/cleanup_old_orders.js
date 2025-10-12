require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');

async function cleanup() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log('\n🔍 Analyzing orders...\n');
  
  // Find orders without proper data
  const ordersToDelete = await Order.find({
    $or: [
      { customerLocation: { $exists: false } },
      { 'customer.name': { $exists: false } },
      { 'customer.name': null },
      { 'customer.name': 'N/A' }
    ]
  }).lean();
  
  console.log(`❌ Orders to delete: ${ordersToDelete.length}`);
  
  // Find valid orders
  const validOrders = await Order.find({
    customerLocation: { $exists: true },
    'customer.name': { $exists: true, $ne: null, $ne: 'N/A' }
  }).lean();
  
  console.log(`✅ Valid orders to keep: ${validOrders.length}\n`);
  
  console.log('=' .repeat(60));
  console.log('CLEANUP SUMMARY');
  console.log('='.repeat(60) + '\n');
  
  if (ordersToDelete.length > 0) {
    console.log('📋 Orders that will be DELETED:');
    ordersToDelete.slice(0, 5).forEach((order, i) => {
      console.log(`   ${i + 1}. ${order._id} - ${order.status}`);
    });
    if (ordersToDelete.length > 5) {
      console.log(`   ... and ${ordersToDelete.length - 5} more`);
    }
    console.log('');
  }
  
  if (validOrders.length > 0) {
    console.log('✅ Valid orders that will be KEPT:');
    validOrders.forEach((order, i) => {
      console.log(`   ${i + 1}. ${order.customer.name} - ${order.customerLocation?.name || 'Unknown location'}`);
    });
    console.log('');
  }
  
  console.log('='.repeat(60) + '\n');
  console.log('⚠️  WARNING: This will permanently delete incomplete orders!');
  console.log('💡 Run this command to proceed:\n');
  console.log('   node scripts/cleanup_old_orders.js --confirm\n');
  
  // Check if --confirm flag was passed
  if (process.argv.includes('--confirm')) {
    console.log('🗑️  Deleting incomplete orders...\n');
    
    const result = await Order.deleteMany({
      $or: [
        { customerLocation: { $exists: false } },
        { 'customer.name': { $exists: false } },
        { 'customer.name': null },
        { 'customer.name': 'N/A' }
      ]
    });
    
    console.log(`✅ Deleted ${result.deletedCount} incomplete orders\n`);
    
    // Show final count
    const remaining = await Order.countDocuments();
    console.log(`📊 Remaining orders: ${remaining}`);
    
    const byStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📈 Orders by status:');
    byStatus.forEach(({ _id, count }) => {
      console.log(`   ${_id}: ${count}`);
    });
    
    console.log('\n🎉 Cleanup complete! Refresh your frontend.\n');
  }
  
  process.exit(0);
}

cleanup();
