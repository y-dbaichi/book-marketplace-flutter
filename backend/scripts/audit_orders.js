require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');

async function auditOrders() {
  try {
    console.log('🔍 Connecting to MongoDB...\n');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const allOrders = await Order.find().lean();
    console.log(`📦 Total orders in database: ${allOrders.length}\n`);
    
    if (allOrders.length === 0) {
      console.log('✅ No orders to audit');
      process.exit(0);
    }
    
    // New schema validation
    const validStatuses = ['pending', 'confirmed', 'delivered', 'refused'];
    const invalidOrders = [];
    const validOrders = [];
    
    console.log('=' .repeat(60));
    console.log('AUDIT REPORT');
    console.log('='.repeat(60) + '\n');
    
    for (const order of allOrders) {
      const issues = [];
      
      // Check status
      if (!validStatuses.includes(order.status)) {
        issues.push(`❌ Invalid status: "${order.status}" (should be: pending, confirmed, delivered, or refused)`);
      }
      
      // Check if orderType exists (should NOT exist in new schema)
      if (order.orderType !== undefined) {
        issues.push(`⚠️  Has deprecated field: orderType = "${order.orderType}"`);
      }
      
      // Check required fields
      if (!order.book) issues.push('❌ Missing: book');
      if (!order.buyer || !order.buyer.user) issues.push('❌ Missing: buyer.user');
      if (!order.customer || !order.customer.name) issues.push('❌ Missing: customer.name');
      if (!order.quantity) issues.push('❌ Missing: quantity');
      if (!order.totalPrice) issues.push('❌ Missing: totalPrice');
      
      // Check customerLocation
      if (!order.customerLocation) {
        issues.push('❌ Missing: customerLocation');
      } else {
        if (!order.customerLocation.coordinates || order.customerLocation.coordinates.length !== 2) {
          issues.push('❌ Invalid: customerLocation.coordinates');
        }
      }
      
      if (issues.length > 0) {
        invalidOrders.push({ order, issues });
      } else {
        validOrders.push(order);
      }
    }
    
    // Print results
    console.log(`✅ Valid orders: ${validOrders.length}`);
    console.log(`❌ Invalid orders: ${invalidOrders.length}\n`);
    
    if (invalidOrders.length > 0) {
      console.log('=' .repeat(60));
      console.log('INVALID ORDERS DETAILS');
      console.log('='.repeat(60) + '\n');
      
      invalidOrders.forEach((item, idx) => {
        console.log(`\n📋 Order ${idx + 1}:`);
        console.log(`   ID: ${item.order._id}`);
        console.log(`   Status: ${item.order.status}`);
        console.log(`   Created: ${item.order.createdAt}`);
        if (item.order.book) console.log(`   Book: ${item.order.book.title || item.order.book}`);
        console.log(`\n   Issues:`);
        item.issues.forEach(issue => console.log(`   ${issue}`));
      });
      
      console.log('\n\n' + '='.repeat(60));
      console.log('RECOMMENDED ACTIONS');
      console.log('='.repeat(60) + '\n');
      
      const statusIssues = invalidOrders.filter(i => 
        i.issues.some(issue => issue.includes('Invalid status'))
      );
      
      const orderTypeIssues = invalidOrders.filter(i => 
        i.issues.some(issue => issue.includes('orderType'))
      );
      
      if (statusIssues.length > 0) {
        console.log(`📝 ${statusIssues.length} orders have invalid status values:`);
        const statuses = {};
        statusIssues.forEach(i => {
          const status = i.order.status;
          statuses[status] = (statuses[status] || 0) + 1;
        });
        Object.entries(statuses).forEach(([status, count]) => {
          console.log(`   - "${status}": ${count} orders`);
        });
        console.log('\n   Suggested mapping:');
        console.log('   - "in_transit" → "confirmed"');
        console.log('   - "completed" → "delivered"');
        console.log('   - "cancelled" → "refused"');
        console.log('   - "preparing" → "confirmed"');
        console.log('   - "ready" → "confirmed"\n');
      }
      
      if (orderTypeIssues.length > 0) {
        console.log(`📝 ${orderTypeIssues.length} orders have deprecated "orderType" field`);
        console.log('   Action: Remove this field (all orders are now delivery-only)\n');
      }
      
      console.log('💡 To fix all issues automatically, run:');
      console.log('   node scripts/migrate_orders.js\n');
    } else {
      console.log('✅ All orders are valid! No migration needed.\n');
    }
    
    // Summary by status
    console.log('=' .repeat(60));
    console.log('ORDER STATUS BREAKDOWN');
    console.log('='.repeat(60) + '\n');
    
    const statusCount = {};
    allOrders.forEach(o => {
      statusCount[o.status] = (statusCount[o.status] || 0) + 1;
    });
    
    Object.entries(statusCount).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
      const isValid = validStatuses.includes(status);
      const icon = isValid ? '✅' : '❌';
      console.log(`   ${icon} ${status.padEnd(15)} ${count} orders`);
    });
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

auditOrders();
