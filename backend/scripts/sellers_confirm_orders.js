require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const Book = require('../models/Book');

async function run() {
  try {
    console.log('🔌 Connecting MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);

    // Find all pending orders
    const pendingOrders = await Order.find({
      status: 'pending'
    }).populate('book');

    if (pendingOrders.length === 0) {
      console.log('ℹ️  No pending orders found to confirm.');
      process.exit(0);
    }

    console.log(`📋 Found ${pendingOrders.length} pending order(s)`);

    // Update each pending order to confirmed
    const updates = [];
    for (const order of pendingOrders) {
      order.status = 'confirmed';
      order.sellerNotes = 'Order confirmed by seller';
      updates.push(order.save());
    }

    await Promise.all(updates);

    console.log(`\n✅ Updated ${updates.length} order(s) to "confirmed" status`);

    // Show summary
    console.log('\n📊 Confirmed Orders Summary:');
    const confirmedOrders = await Order.find({
      status: 'confirmed'
    }).populate('book');

    for (const order of confirmedOrders) {
      console.log(`   • ${order.customer.name} ordered "${order.book?.title}" (${order.quantity}x)`);
      console.log(`     Seller: ${order.buyer.name} - Status: ${order.status}`);
    }

    console.log('\n✅ Done. All pending orders confirmed by sellers!');
    process.exit(0);
  } catch (err) {
    console.error('💥 Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

run();
