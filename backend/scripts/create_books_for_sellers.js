require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Book = require('../models/Book');

async function run() {
  try {
    console.log('🔌 Connecting MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);

    // Fetch sellers
    const emails = ['seller1@gmail.com', 'seller2@gmail.com'];
    const [seller1, seller2] = await Promise.all(
      emails.map(e => User.findOne({ email: e, userType: 'buyer' }))
    );

    if (!seller1 || !seller2) {
      console.error('❌ Missing seller accounts. Create sellers first.');
      console.error('   Expected: seller1@gmail.com & seller2@gmail.com with userType="buyer"');
      process.exit(1);
    }

    // Wipe old books from these sellers to avoid duplicates
    console.log('🧹 Removing existing listings from these sellers...');
    const delRes = await Book.deleteMany({ buyer: { $in: [seller1._id, seller2._id] } });
    console.log(`   Deleted: ${delRes.deletedCount} book(s)`);

    // New listings
    const seller1Books = [
      {
        title: 'The Alchemist',
        author: 'Paulo Coelho',
        description: 'A magical tale about following your dreams.',
        price: 85,
        quantity: 5,
        quality: 'excellent',
        category: 'Fiction',
        status: 'available',
        buyer: seller1._id
      },
      {
        title: 'Sapiens',
        author: 'Yuval Noah Harari',
        description: 'A brief history of humankind.',
        price: 120,
        quantity: 3,
        quality: 'good',
        category: 'History',
        status: 'available',
        buyer: seller1._id
      },
      {
        title: 'Atomic Habits',
        author: 'James Clear',
        description: 'Tiny changes, remarkable results.',
        price: 95,
        quantity: 8,
        quality: 'excellent',
        category: 'Self-Help',
        status: 'available',
        buyer: seller1._id
      }
    ];

    const seller2Books = [
      {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        description: 'Classic American novel.',
        price: 65,
        quantity: 4,
        quality: 'good',
        category: 'Fiction',
        status: 'available',
        buyer: seller2._id
      },
      {
        title: 'Educated',
        author: 'Tara Westover',
        description: 'Memoir about self-invention.',
        price: 110,
        quantity: 2,
        quality: 'excellent',
        category: 'Biography',
        status: 'available',
        buyer: seller2._id
      },
      {
        title: 'Think and Grow Rich',
        author: 'Napoleon Hill',
        description: 'Classic guide to success.',
        price: 75,
        quantity: 6,
        quality: 'good',
        category: 'Business',
        status: 'available',
        buyer: seller2._id
      }
    ];

    // Insert
    console.log('📦 Inserting books...');
    const inserted = await Book.insertMany([...seller1Books, ...seller2Books]);
    console.log(`   Inserted: ${inserted.length} book(s)`);

    // Summary
    const counts = await Book.aggregate([
      { $match: { buyer: { $in: [seller1._id, seller2._id] } } },
      { $group: { _id: '$buyer', count: { $sum: 1 } } }
    ]);

    console.log('\n📊 Summary per seller:');
    for (const c of counts) {
      const who = String(c._id) === String(seller1._id) ? 'seller1@gmail.com' : 'seller2@gmail.com';
      console.log(` - ${who}: ${c.count} books`);
    }

    console.log('\n✅ Done. Listings are ready.');
    process.exit(0);
  } catch (err) {
    console.error('💥 Error:', err.message);
    process.exit(1);
  }
}

run();
