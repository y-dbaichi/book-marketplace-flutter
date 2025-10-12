require('dotenv').config();
const mongoose = require('mongoose');

async function migrateOrders() {
  try {
    console.log('🔄 Connecting to MongoDB...\n');
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('=' .repeat(60));
    console.log('ORDER MIGRATION SCRIPT');
    console.log('='.repeat(60) + '\n');
    
    const db = mongoose.connection.db;
    const ordersCollection = db.collection('orders');
    
    // Get all orders that need migration
    const allOrders = await ordersCollection.find().toArray();
    console.log(`📦 Total orders: ${allOrders.length}\n`);
    
    let migratedCount = 0;
    
    // Status mapping
    const statusMapping = {
      'in_transit': 'confirmed',
      'completed': 'delivered',
      'cancelled': 'refused',
      'preparing': 'confirmed',
      'ready': 'confirmed',
      'disputed': 'refused'
    };
    
    console.log('🔧 Starting migration...\n');
    
    for (const order of allOrders) {
      const updates = {};
      let needsUpdate = false;
      
      // 1. Migrate status if needed
      if (statusMapping[order.status]) {
        updates.status = statusMapping[order.status];
        needsUpdate = true;
        console.log(`   📝 Order ${order._id}: "${order.status}" → "${updates.status}"`);
      }
      
      // 2. Remove deprecated orderType field
      if (order.orderType !== undefined) {
        updates.$unset = { orderType: "" };
        needsUpdate = true;
        console.log(`   🗑️  Order ${order._id}: Removing orderType="${order.orderType}"`);
      }
      
      // 3. Apply updates
      if (needsUpdate) {
        const updateDoc = updates.$unset 
          ? { $set: updates, $unset: updates.$unset }
          : { $set: updates };
        
        delete updateDoc.$set.$unset;
        
        await ordersCollection.updateOne(
          { _id: order._id },
          updateDoc
        );
        migratedCount++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION COMPLETE');
    console.log('='.repeat(60) + '\n');
    
    console.log(`✅ Migrated: ${migratedCount} orders`);
    console.log(`✅ No changes: ${allOrders.length - migratedCount} orders\n`);
    
    // Verify migration
    console.log('🔍 Verifying migration...\n');
    
    const finalOrders = await ordersCollection.find().toArray();
    const validStatuses = ['pending', 'confirmed', 'delivered', 'refused'];
    
    const statusBreakdown = {};
    let ordersWithOrderType = 0;
    let invalidStatus = 0;
    
    finalOrders.forEach(order => {
      // Count statuses
      statusBreakdown[order.status] = (statusBreakdown[order.status] || 0) + 1;
      
      // Check for issues
      if (!validStatuses.includes(order.status)) invalidStatus++;
      if (order.orderType !== undefined) ordersWithOrderType++;
    });
    
    console.log('📊 Final Status Breakdown:');
    Object.entries(statusBreakdown).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
      const isValid = validStatuses.includes(status);
      const icon = isValid ? '✅' : '❌';
      console.log(`   ${icon} ${status.padEnd(15)} ${count} orders`);
    });
    
    console.log('\n📊 Validation Results:');
    console.log(`   ${invalidStatus === 0 ? '✅' : '❌'} Invalid statuses: ${invalidStatus}`);
    console.log(`   ${ordersWithOrderType === 0 ? '✅' : '❌'} Orders with orderType: ${ordersWithOrderType}\n`);
    
    if (invalidStatus === 0 && ordersWithOrderType === 0) {
      console.log('🎉 SUCCESS! All orders are now valid!\n');
    } else {
      console.log('⚠️  Some issues remain. Run audit again:\n');
      console.log('   node scripts/audit_orders.js\n');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateOrders();
