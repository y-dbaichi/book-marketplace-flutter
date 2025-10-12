require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');

async function checkLocations() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const orders = await Order.find({ status: 'confirmed' }).limit(10).lean();
  
  console.log(`\n📦 Found ${orders.length} confirmed orders\n`);
  console.log('='.repeat(70));
  
  orders.forEach((order, i) => {
    console.log(`\nOrder ${i + 1}: ${order._id}`);
    console.log(`  Book: ${order.book?.title || order.book}`);
    console.log(`  Customer: ${order.customer?.name || 'N/A'}`);
    console.log(`  Status: ${order.status}`);
    console.log(`  Has customerLocation: ${!!order.customerLocation}`);
    if (order.customerLocation) {
      console.log(`    - Name: ${order.customerLocation.name || 'N/A'}`);
      console.log(`    - Address: ${order.customerLocation.address || 'N/A'}`);
      console.log(`    - Coords: ${order.customerLocation.coordinates}`);
    }
    console.log(`  Has buyerLocation: ${!!order.buyerLocation}`);
    console.log(`  Has orderType: ${!!order.orderType}`);
  });
  
  console.log('\n' + '='.repeat(70) + '\n');
  
  const ordersWithoutLocation = await Order.countDocuments({ 
    status: 'confirmed',
    customerLocation: { $exists: false }
  });
  
  console.log(`⚠️  Orders without customerLocation: ${ordersWithoutLocation}`);
  
  if (ordersWithoutLocation > 0) {
    console.log('\n💡 These orders need location data added.');
    console.log('   Would you like to:');
    console.log('   1. Add mock delivery locations to old orders');
    console.log('   2. Delete old orders without locations');
    console.log('   3. Leave them as-is (they won\'t show in mobile app)\n');
  }
  
  process.exit(0);
}

checkLocations();
