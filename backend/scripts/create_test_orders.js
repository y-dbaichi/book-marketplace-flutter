require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const Book = require('../models/Book');

async function run() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');
    
    const buyer = await User.findOne({ email: 'ham@gmail.com' });
    if (!buyer) {
      console.error('❌ Buyer not found');
      process.exit(1);
    }
    console.log(`👤 Buyer: ${buyer.email}\n`);
    
    // Find existing book or create new one
    let book = await Book.findOne({ seller: buyer._id });
    
    if (!book) {
      console.log('📚 Creating test book...');
      book = await Book.create({
        title: 'Web Development Essentials',
        author: 'Jane Smith',
        isbn: '9781234567890',
        price: 199,
        description: 'A comprehensive guide to modern web development',
        category: 'Technology',
        coverImage: 'https://via.placeholder.com/400x600',
        stock: 100,
        quantity: 100,
        seller: buyer._id,
        buyer: buyer._id,
        quality: 'excellent'  // ✅ Correct enum value
      });
      console.log('✅ Book created\n');
    } else {
      console.log(`📚 Using existing book: ${book.title}\n`);
    }
    
    console.log('📦 Creating delivery orders...\n');
    
    const points = [
      { name: 'Café Paris', address: 'Boulevard Mohammed V, Casablanca', coords: [-7.6298, 33.5731], customer: 'Ahmed Bennani', phone: '0612345678', status: 'confirmed' },
      { name: 'Twin Center', address: 'Boulevard Zerktouni, Casablanca', coords: [-7.6308, 33.5885], customer: 'Fatima Alami', phone: '0623456789', status: 'confirmed' },
      { name: 'Morocco Mall', address: 'Ain Diab, Casablanca', coords: [-7.6893, 33.5468], customer: 'Youssef Tazi', phone: '0634567890', status: 'confirmed' },
      { name: 'Marina Shopping', address: 'Marina, Casablanca', coords: [-7.6572, 33.5138], customer: 'Sanaa El Fassi', phone: '0645678901', status: 'pending' }
    ];
    
    let confirmed = 0;
    let pending = 0;
    
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      
      await Order.create({
        book: book._id,
        seller: {
          user: buyer._id,
          name: `${buyer.profile?.firstName || 'Hamza'} ${buyer.profile?.lastName || 'Fajir'}`,
          email: buyer.email
        },
        buyer: {
          name: p.customer,
          email: `${p.customer.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          phone: p.phone
        },
        quantity: i + 1,
        totalPrice: book.price * (i + 1),
        status: p.status,
        buyerLocation: {
          type: 'Point',
          coordinates: p.coords,
          name: p.name,
          address: p.address
        }
      });
      
      if (p.status === 'confirmed') {
        confirmed++;
        console.log(`  ✅ Confirmed: ${p.name}`);
      } else {
        pending++;
        console.log(`  ⏳ Pending: ${p.name}`);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Orders created successfully!');
    console.log('='.repeat(50));
    console.log(`\n📊 Summary:`);
    console.log(`   Total: ${points.length} orders`);
    console.log(`   Confirmed (will export): ${confirmed}`);
    console.log(`   Pending (won't export): ${pending}`);
    console.log(`\n📱 Next Steps:`);
    console.log(`   1. Open Flutter app`);
    console.log(`   2. Click cloud download icon (☁️) in top-right`);
    console.log(`   3. Generate new export`);
    console.log(`   4. Download to see ${confirmed} delivery points on map!\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.errors) {
      console.error('Validation errors:');
      Object.keys(error.errors).forEach(key => {
        console.error(`   - ${key}: ${error.errors[key].message}`);
      });
    }
    process.exit(1);
  }
}

run();
