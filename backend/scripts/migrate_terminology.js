require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('✅ Connected to MongoDB');
    console.log('\n📊 Starting terminology migration...\n');

    // Get direct access to collections (bypass Mongoose models to avoid validation issues)
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const booksCollection = db.collection('books');
    const ordersCollection = db.collection('orders');

    // ===== STEP 1: Migrate User collection =====
    console.log('👤 Step 1: Migrating User collection...');

    // Update userType: 'buyer' -> 'seller' (sellers are those who sell books)
    const sellerUpdate = await usersCollection.updateMany(
      { userType: 'buyer' },
      { $set: { userType: 'seller' } }
    );
    console.log(`   ✅ Updated ${sellerUpdate.modifiedCount} user(s) from 'buyer' to 'seller'`);

    // Update userType: 'customer' -> 'buyer' (buyers are those who buy books)
    const buyerUpdate = await usersCollection.updateMany(
      { userType: 'customer' },
      { $set: { userType: 'buyer' } }
    );
    console.log(`   ✅ Updated ${buyerUpdate.modifiedCount} user(s) from 'customer' to 'buyer'`);

    // ===== STEP 2: Migrate Book collection =====
    console.log('\n📚 Step 2: Migrating Book collection...');

    // Rename field: 'buyer' -> 'seller'
    const bookUpdate = await booksCollection.updateMany(
      { buyer: { $exists: true } },
      { $rename: { buyer: 'seller' } }
    );
    console.log(`   ✅ Updated ${bookUpdate.modifiedCount} book(s): renamed 'buyer' field to 'seller'`);

    // ===== STEP 3: Migrate Order collection =====
    console.log('\n📦 Step 3: Migrating Order collection...');

    // Get all orders to migrate them properly
    const orders = await ordersCollection.find({}).toArray();
    console.log(`   Found ${orders.length} order(s) to migrate`);

    let migratedCount = 0;
    for (const order of orders) {
      const updates = {};

      // Handle customer -> buyer renaming
      if (order.customer !== undefined) {
        updates.buyer = order.customer;
        updates.$unset = { customer: '' };
      }

      // Handle buyer -> seller renaming (old buyer was the seller)
      if (order.buyer !== undefined && !updates.buyer) {
        // If we haven't set buyer from customer, this is the old buyer (seller)
        updates.seller = order.buyer;
        if (!updates.$unset) updates.$unset = {};
        updates.$unset.buyer = '';
      } else if (order.buyer !== undefined && updates.buyer) {
        // We've already set buyer from customer, so old buyer becomes seller
        updates.seller = order.buyer;
      }

      // Handle location renaming: customerLocation -> buyerLocation
      if (order.customerLocation !== undefined) {
        updates.buyerLocation = order.customerLocation;
        if (!updates.$unset) updates.$unset = {};
        updates.$unset.customerLocation = '';
      }

      // Handle location renaming: buyerLocation -> sellerLocation
      if (order.buyerLocation !== undefined && !updates.buyerLocation) {
        updates.sellerLocation = order.buyerLocation;
        if (!updates.$unset) updates.$unset = {};
        updates.$unset.buyerLocation = '';
      } else if (order.buyerLocation !== undefined && updates.buyerLocation) {
        // We've already set buyerLocation from customerLocation
        updates.sellerLocation = order.buyerLocation;
      }

      // Handle notes renaming: customerNotes -> buyerNotes
      if (order.customerNotes !== undefined) {
        updates.buyerNotes = order.customerNotes;
        if (!updates.$unset) updates.$unset = {};
        updates.$unset.customerNotes = '';
      }

      // Handle notes renaming: buyerNotes -> sellerNotes
      if (order.buyerNotes !== undefined && !updates.buyerNotes) {
        updates.sellerNotes = order.buyerNotes;
        if (!updates.$unset) updates.$unset = {};
        updates.$unset.buyerNotes = '';
      } else if (order.buyerNotes !== undefined && updates.buyerNotes) {
        // We've already set buyerNotes from customerNotes
        updates.sellerNotes = order.buyerNotes;
      }

      // Apply updates if there are any
      if (Object.keys(updates).length > 0) {
        const updateDoc = {};
        const unsetFields = updates.$unset;
        delete updates.$unset;

        if (Object.keys(updates).length > 0) {
          updateDoc.$set = updates;
        }
        if (unsetFields && Object.keys(unsetFields).length > 0) {
          updateDoc.$unset = unsetFields;
        }

        await ordersCollection.updateOne(
          { _id: order._id },
          updateDoc
        );
        migratedCount++;
      }
    }

    console.log(`   ✅ Migrated ${migratedCount} order(s) with correct field names`);

    // ===== STEP 4: Verification =====
    console.log('\n🔍 Step 4: Verifying migration...');

    const sellerCount = await usersCollection.countDocuments({ userType: 'seller' });
    const buyerCount = await usersCollection.countDocuments({ userType: 'buyer' });
    const oldBuyerCount = await usersCollection.countDocuments({ userType: 'buyer' });
    const oldCustomerCount = await usersCollection.countDocuments({ userType: 'customer' });

    console.log(`\n   Users:`);
    console.log(`     - Sellers: ${sellerCount}`);
    console.log(`     - Buyers: ${buyerCount}`);
    console.log(`     - Old 'buyer' userType remaining: ${oldBuyerCount}`);
    console.log(`     - Old 'customer' userType remaining: ${oldCustomerCount}`);

    const booksWithSeller = await booksCollection.countDocuments({ seller: { $exists: true } });
    const booksWithOldBuyer = await booksCollection.countDocuments({ buyer: { $exists: true } });

    console.log(`\n   Books:`);
    console.log(`     - Books with 'seller' field: ${booksWithSeller}`);
    console.log(`     - Books with old 'buyer' field: ${booksWithOldBuyer}`);

    const ordersWithNewFields = await ordersCollection.countDocuments({
      buyer: { $exists: true },
      seller: { $exists: true }
    });
    const ordersWithOldCustomer = await ordersCollection.countDocuments({ customer: { $exists: true } });

    console.log(`\n   Orders:`);
    console.log(`     - Orders with new 'buyer' & 'seller' fields: ${ordersWithNewFields}`);
    console.log(`     - Orders with old 'customer' field: ${ordersWithOldCustomer}`);

    console.log('\n✅ Migration completed successfully!\n');
    console.log('Summary:');
    console.log('  - Users: customer → buyer, buyer → seller');
    console.log('  - Books: buyer → seller');
    console.log('  - Orders: customer → buyer, buyer → seller, locations & notes updated');

    process.exit(0);
  } catch (err) {
    console.error('💥 Migration error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

run();
