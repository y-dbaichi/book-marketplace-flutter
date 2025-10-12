require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Book = require('../models/Book');
const Order = require('../models/Order');

async function ensureCustomer(email, firstName, lastName, phone, location) {
  let u = await User.findOne({ email });
  if (!u) {
    u = new User({
      email,
      password: 'aaaaaa',         // pre-save will hash
      userType: 'customer',
      displayName: `${firstName} ${lastName}`,
      phone,
      profile: { firstName, lastName },
      location
    });
    await u.save();
    console.log(`👤 Created customer: ${email}`);
  } else {
    console.log(`👤 Found customer: ${email}`);
  }
  return u;
}

async function run() {
  try {
    console.log('🔌 Connecting MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);

    // Sellers
    const seller1 = await User.findOne({ email: 'seller1@gmail.com', userType: 'buyer' }).lean();
    const seller2 = await User.findOne({ email: 'seller2@gmail.com', userType: 'buyer' }).lean();
    if (!seller1 || !seller2) {
      console.error('❌ Sellers not found. Create sellers first.');
      process.exit(1);
    }

    // Ensure two customers
    const cust1 = await ensureCustomer(
      'buyer1@gmail.com', 'Youssef', 'Hassan', '+212600000011',
      {
        name: 'Home',
        address: 'Quartier Maarif, Casablanca',
        coordinates: { latitude: 33.5731, longitude: -7.6256 }
      }
    );
    const cust2 = await ensureCustomer(
      'buyer2@gmail.com', 'Khadija', 'Alami', '+212600000012',
      {
        name: 'Home',
        address: 'Agdal, Rabat',
        coordinates: { latitude: 33.9715, longitude: -6.8344 }
      }
    );

    // Pull some books
    const seller1Books = await Book.find({ buyer: seller1._id, status: 'available' }).limit(3).lean();
    const seller2Books = await Book.find({ buyer: seller2._id, status: 'available' }).limit(3).lean();
    if (seller1Books.length === 0 && seller2Books.length === 0) {
      console.error('❌ No available books found for sellers.');
      process.exit(1);
    }

    // Build orders to create (pending)
    const candidates = [
      ...seller1Books.map((b, i) => ({ book: b, seller: seller1, customer: i % 2 === 0 ? cust1 : cust2 })),
      ...seller2Books.map((b, i) => ({ book: b, seller: seller2, customer: i % 2 === 0 ? cust2 : cust1 })),
    ];

    let created = 0;
    for (const c of candidates) {
      const quantity = Math.min(1 + Math.floor(Math.random() * 2), c.book.quantity || 1); // 1–2, not exceeding stock
      const totalPrice = Number(c.book.price) * Number(quantity);

      // Avoid duplicating the exact same pending order for the same trio (customer+book+seller)
      const exists = await Order.exists({
        customer: c.customer._id,
        buyer: c.seller._id,
        book: c.book._id,
        status: 'pending'
      });
      if (exists) {
        continue;
      }

      const order = new Order({
        customer: c.customer._id,     // ref to User (customer)
        buyer: c.seller._id,          // ref to User (seller)
        book: c.book._id,             // ref to Book
        quantity,
        totalPrice,
        orderType: 'delivery',        // your current schema expects this
        status: 'pending',            // keep sellers from confirming yet
        customerNotes: 'Please deliver in the afternoon.',
        locations: {
          buyerLocation: c.seller.location || undefined,     // same shape as User.location
          customerLocation: c.customer.location || undefined // destination = customer place
        }
      });

      await order.save();
      created++;
      console.log(`📦 Created pending order: ${order._id} • ${c.customer.email} → ${c.book.title} (${quantity}x)`);
    }

    // Summary
    const pendingCount = await Order.countDocuments({ status: 'pending' });
    console.log('\n✅ Done.');
    console.log(`   Newly created: ${created}`);
    console.log(`   Total pending orders now: ${pendingCount}\n`);

    process.exit(0);
  } catch (err) {
    console.error('💥 Error:', err);
    process.exit(1);
  }
}

run();
