require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Book = require('../models/Book');
const Order = require('../models/Order');

async function seedExtensiveTestData() {
  try {
    console.log('🔌 Connecting to MongoDB...\n');
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('🗑️  Step 1: Deleting ALL existing data...');
    await User.deleteMany({});
    await Book.deleteMany({});
    await Order.deleteMany({});
    console.log('   ✅ Deleted all users, books, and orders\n');

    console.log('👥 Step 2: Creating users...\n');

    // Create 5 sellers with diverse locations across Morocco
    const sellers = await User.create([
      {
        email: 'seller1@gmail.com',
        password: 'aaaaaa',
        userType: 'seller',
        displayName: 'Ahmed Books',
        phone: '+212600000001',
        profile: { firstName: 'Ahmed', lastName: 'Benali' },
        location: {
          name: 'Librairie Centrale Casablanca',
          address: 'Boulevard Mohammed V, Casablanca',
          coordinates: { latitude: 33.5731, longitude: -7.6298 }
        }
      },
      {
        email: 'seller2@gmail.com',
        password: 'aaaaaa',
        userType: 'seller',
        displayName: 'Fatima Library',
        phone: '+212600000002',
        profile: { firstName: 'Fatima', lastName: 'Alaoui' },
        location: {
          name: 'Librairie Al Houda Rabat',
          address: 'Avenue Hassan II, Rabat',
          coordinates: { latitude: 33.9716, longitude: -6.8498 }
        }
      },
      {
        email: 'seller3@gmail.com',
        password: 'aaaaaa',
        userType: 'seller',
        displayName: 'Karim Books',
        phone: '+212600000003',
        profile: { firstName: 'Karim', lastName: 'Tazi' },
        location: {
          name: 'Librairie Universitaire Fes',
          address: 'Avenue des Almohades, Fes',
          coordinates: { latitude: 34.0331, longitude: -5.0003 }
        }
      },
      {
        email: 'seller4@gmail.com',
        password: 'aaaaaa',
        userType: 'seller',
        displayName: 'Laila Bookstore',
        phone: '+212600000004',
        profile: { firstName: 'Laila', lastName: 'Chaoui' },
        location: {
          name: 'Librairie des Arts Marrakech',
          address: 'Avenue Mohammed VI, Marrakech',
          coordinates: { latitude: 31.6295, longitude: -7.9811 }
        }
      },
      {
        email: 'seller5@gmail.com',
        password: 'aaaaaa',
        userType: 'seller',
        displayName: 'Omar Literature',
        phone: '+212600000005',
        profile: { firstName: 'Omar', lastName: 'Idrissi' },
        location: {
          name: 'Librairie Moderne Tanger',
          address: 'Boulevard Pasteur, Tanger',
          coordinates: { latitude: 35.7595, longitude: -5.8340 }
        }
      }
    ]);

    console.log(`   ✅ Created ${sellers.length} sellers`);

    // Create 10 buyers with diverse locations
    const buyers = await User.create([
      {
        email: 'buyer1@gmail.com',
        password: 'aaaaaa',
        userType: 'buyer',
        displayName: 'Youssef Hassan',
        phone: '+212600000101',
        profile: { firstName: 'Youssef', lastName: 'Hassan' },
        location: {
          name: 'Home',
          address: 'Quartier Maarif, Casablanca',
          coordinates: { latitude: 33.5731, longitude: -7.6256 }
        }
      },
      {
        email: 'buyer2@gmail.com',
        password: 'aaaaaa',
        userType: 'buyer',
        displayName: 'Khadija Alami',
        phone: '+212600000102',
        profile: { firstName: 'Khadija', lastName: 'Alami' },
        location: {
          name: 'Office',
          address: 'Agdal, Rabat',
          coordinates: { latitude: 33.9715, longitude: -6.8344 }
        }
      },
      {
        email: 'buyer3@gmail.com',
        password: 'aaaaaa',
        userType: 'buyer',
        displayName: 'Mehdi Benkirane',
        phone: '+212600000103',
        profile: { firstName: 'Mehdi', lastName: 'Benkirane' },
        location: {
          name: 'Apartment',
          address: 'Hay Riad, Rabat',
          coordinates: { latitude: 33.9650, longitude: -6.8600 }
        }
      },
      {
        email: 'buyer4@gmail.com',
        password: 'aaaaaa',
        userType: 'buyer',
        displayName: 'Sara Bennani',
        phone: '+212600000104',
        profile: { firstName: 'Sara', lastName: 'Bennani' },
        location: {
          name: 'Villa',
          address: 'Anfa, Casablanca',
          coordinates: { latitude: 33.5800, longitude: -7.6300 }
        }
      },
      {
        email: 'buyer5@gmail.com',
        password: 'aaaaaa',
        userType: 'buyer',
        displayName: 'Amine Chakir',
        phone: '+212600000105',
        profile: { firstName: 'Amine', lastName: 'Chakir' },
        location: {
          name: 'Student Housing',
          address: 'Université Hassan II, Casablanca',
          coordinates: { latitude: 33.5650, longitude: -7.6400 }
        }
      },
      {
        email: 'buyer6@gmail.com',
        password: 'aaaaaa',
        userType: 'buyer',
        displayName: 'Salma Elouardi',
        phone: '+212600000106',
        profile: { firstName: 'Salma', lastName: 'Elouardi' },
        location: {
          name: 'Riad',
          address: 'Medina, Fes',
          coordinates: { latitude: 34.0644, longitude: -4.9770 }
        }
      },
      {
        email: 'buyer7@gmail.com',
        password: 'aaaaaa',
        userType: 'buyer',
        displayName: 'Hassan Moussaoui',
        phone: '+212600000107',
        profile: { firstName: 'Hassan', lastName: 'Moussaoui' },
        location: {
          name: 'Hotel',
          address: 'Gueliz, Marrakech',
          coordinates: { latitude: 31.6369, longitude: -8.0088 }
        }
      },
      {
        email: 'buyer8@gmail.com',
        password: 'aaaaaa',
        userType: 'buyer',
        displayName: 'Nadia Filali',
        phone: '+212600000108',
        profile: { firstName: 'Nadia', lastName: 'Filali' },
        location: {
          name: 'Café',
          address: 'Kasbah, Tanger',
          coordinates: { latitude: 35.7847, longitude: -5.8113 }
        }
      },
      {
        email: 'buyer9@gmail.com',
        password: 'aaaaaa',
        userType: 'buyer',
        displayName: 'Rachid Tahiri',
        phone: '+212600000109',
        profile: { firstName: 'Rachid', lastName: 'Tahiri' },
        location: {
          name: 'Office Building',
          address: 'Twin Center, Casablanca',
          coordinates: { latitude: 33.5862, longitude: -7.6284 }
        }
      },
      {
        email: 'buyer10@gmail.com',
        password: 'aaaaaa',
        userType: 'buyer',
        displayName: 'Zineb Hamdi',
        phone: '+212600000110',
        profile: { firstName: 'Zineb', lastName: 'Hamdi' },
        location: {
          name: 'Library',
          address: 'Hay Moulay Abdellah, Rabat',
          coordinates: { latitude: 33.9533, longitude: -6.8626 }
        }
      }
    ]);

    console.log(`   ✅ Created ${buyers.length} buyers\n`);

    console.log('📚 Step 3: Creating extensive book catalog...\n');

    const bookCategories = {
      Fiction: [
        { title: 'The Alchemist', author: 'Paulo Coelho', description: 'A magical tale about following your dreams' },
        { title: '1984', author: 'George Orwell', description: 'Dystopian masterpiece about totalitarianism' },
        { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', description: 'Jazz Age classic' },
        { title: 'To Kill a Mockingbird', author: 'Harper Lee', description: 'A story of racial injustice' },
        { title: 'Pride and Prejudice', author: 'Jane Austen', description: 'Classic romance novel' },
        { title: 'The Catcher in the Rye', author: 'J.D. Salinger', description: 'Coming of age story' },
        { title: 'Animal Farm', author: 'George Orwell', description: 'Allegorical novella' },
        { title: 'Brave New World', author: 'Aldous Huxley', description: 'Dystopian novel' }
      ],
      'Non-Fiction': [
        { title: 'Sapiens', author: 'Yuval Noah Harari', description: 'A brief history of humankind' },
        { title: 'Educated', author: 'Tara Westover', description: 'A memoir about self-invention' },
        { title: 'Becoming', author: 'Michelle Obama', description: 'Memoir of former First Lady' },
        { title: 'The Immortal Life of Henrietta Lacks', author: 'Rebecca Skloot', description: 'Science and ethics' }
      ],
      'Self-Help': [
        { title: 'Atomic Habits', author: 'James Clear', description: 'Build good habits, break bad ones' },
        { title: 'The 7 Habits of Highly Effective People', author: 'Stephen Covey', description: 'Personal effectiveness' },
        { title: 'The 48 Laws of Power', author: 'Robert Greene', description: 'Power and strategy' },
        { title: 'How to Win Friends and Influence People', author: 'Dale Carnegie', description: 'Social skills' },
        { title: 'The Power of Now', author: 'Eckhart Tolle', description: 'Spiritual enlightenment' }
      ],
      Business: [
        { title: 'Think and Grow Rich', author: 'Napoleon Hill', description: 'Classic success guide' },
        { title: 'Rich Dad Poor Dad', author: 'Robert Kiyosaki', description: 'Financial education' },
        { title: 'The Lean Startup', author: 'Eric Ries', description: 'Innovation methodology' },
        { title: 'Zero to One', author: 'Peter Thiel', description: 'Notes on startups' },
        { title: 'Good to Great', author: 'Jim Collins', description: 'Why some companies make the leap' }
      ],
      Science: [
        { title: 'A Brief History of Time', author: 'Stephen Hawking', description: 'Cosmology explained' },
        { title: 'The Selfish Gene', author: 'Richard Dawkins', description: 'Gene-centered evolution' },
        { title: 'Cosmos', author: 'Carl Sagan', description: 'Science and civilization' }
      ],
      Philosophy: [
        { title: 'Meditations', author: 'Marcus Aurelius', description: 'Stoic philosophy' },
        { title: 'The Republic', author: 'Plato', description: 'Justice and ideal state' },
        { title: 'Thus Spoke Zarathustra', author: 'Friedrich Nietzsche', description: 'Philosophical novel' }
      ]
    };

    const qualities = ['excellent', 'good', 'fair'];
    const allBooks = [];

    let bookIndex = 0;
    for (const [category, booksInCategory] of Object.entries(bookCategories)) {
      for (const bookData of booksInCategory) {
        const seller = sellers[bookIndex % sellers.length];
        const quality = qualities[Math.floor(Math.random() * qualities.length)];
        const basePrice = 50 + Math.floor(Math.random() * 150);
        // Increase quantity range to ensure enough stock for orders
        const quantity = Math.floor(Math.random() * 25) + 10; // 10-34 copies

        allBooks.push({
          title: bookData.title,
          author: bookData.author,
          description: bookData.description,
          price: basePrice,
          quantity: quantity,
          quality: quality,
          category: category,
          status: 'available',
          seller: seller._id
        });

        bookIndex++;
      }
    }

    const createdBooks = await Book.insertMany(allBooks);
    console.log(`   ✅ Created ${createdBooks.length} books across ${Object.keys(bookCategories).length} categories\n`);

    console.log('📦 Step 4: Creating diverse orders for extensive testing...\n');

    const orders = [];
    const statuses = ['pending', 'confirmed', 'delivered', 'refused'];

    // Helper function to create order
    const createOrder = (book, seller, buyer, status, notes = null) => {
      const qty = Math.floor(Math.random() * 3) + 1;
      return {
        book: book._id,
        seller: seller._id,
        buyer: buyer._id,
        quantity: qty,
        totalPrice: book.price * qty,
        status: status,
        buyerNotes: notes,
        buyerLocation: {
          type: 'Point',
          coordinates: [buyer.location.coordinates.longitude, buyer.location.coordinates.latitude],
          name: buyer.location.name,
          address: buyer.location.address
        },
        sellerLocation: {
          type: 'Point',
          coordinates: [seller.location.coordinates.longitude, seller.location.coordinates.latitude],
          name: seller.location.name,
          address: seller.location.address
        }
      };
    };

    // SCENARIO 1: Buyer1 - Mix of all statuses (Edge case: multiple orders from same buyer)
    orders.push(createOrder(createdBooks[0], sellers[0], buyers[0], 'pending', 'Please call before delivery'));
    orders.push(createOrder(createdBooks[1], sellers[0], buyers[0], 'confirmed', 'Leave at reception'));
    orders.push(createOrder(createdBooks[2], sellers[1], buyers[0], 'delivered', null));
    orders.push(createOrder(createdBooks[3], sellers[1], buyers[0], 'refused', null));

    // SCENARIO 2: Buyer2 - Only pending orders
    orders.push(createOrder(createdBooks[4], sellers[1], buyers[1], 'pending', 'Urgent delivery needed'));
    orders.push(createOrder(createdBooks[5], sellers[2], buyers[1], 'pending', null));

    // SCENARIO 3: Buyer3 - Only confirmed orders (ready to deliver)
    orders.push(createOrder(createdBooks[6], sellers[2], buyers[2], 'confirmed', 'Call 30min before'));
    orders.push(createOrder(createdBooks[7], sellers[2], buyers[2], 'confirmed', 'Deliver to security guard'));
    orders.push(createOrder(createdBooks[8], sellers[2], buyers[2], 'confirmed', null));

    // SCENARIO 4: Buyer4 - Only delivered orders
    orders.push(createOrder(createdBooks[9], sellers[3], buyers[3], 'delivered', null));
    orders.push(createOrder(createdBooks[10], sellers[3], buyers[3], 'delivered', null));

    // SCENARIO 5: Buyer5 - Only refused orders
    orders.push(createOrder(createdBooks[11], sellers[3], buyers[4], 'refused', null));

    // SCENARIO 6: Buyer6 - Orders from multiple sellers
    orders.push(createOrder(createdBooks[12], sellers[0], buyers[5], 'confirmed', 'Ring doorbell twice'));
    orders.push(createOrder(createdBooks[13], sellers[1], buyers[5], 'confirmed', null));
    orders.push(createOrder(createdBooks[14], sellers[2], buyers[5], 'pending', null));
    orders.push(createOrder(createdBooks[15], sellers[3], buyers[5], 'delivered', null));
    orders.push(createOrder(createdBooks[16], sellers[4], buyers[5], 'pending', 'Weekend delivery only'));

    // SCENARIO 7: Buyer7 - Large quantities (but reasonable)
    const largeOrder1 = createOrder(createdBooks[17], sellers[4], buyers[6], 'confirmed', 'Bulk order for library');
    largeOrder1.quantity = 5; // Reduced from 10 to 5 to be more realistic
    largeOrder1.totalPrice = createdBooks[17].price * 5;
    orders.push(largeOrder1);

    // SCENARIO 8: Buyer8 - Orders with special notes
    orders.push(createOrder(createdBooks[18], sellers[0], buyers[7], 'pending', 'Gift wrapping required'));
    orders.push(createOrder(createdBooks[19], sellers[1], buyers[7], 'confirmed', 'Include invoice for company'));

    // SCENARIO 9: Buyer9 - Same book from different sellers (edge case)
    orders.push(createOrder(createdBooks[0], sellers[1], buyers[8], 'pending', null));
    orders.push(createOrder(createdBooks[1], sellers[2], buyers[8], 'confirmed', null));

    // SCENARIO 10: Buyer10 - Recent orders (for testing sorting/filtering)
    orders.push(createOrder(createdBooks[20], sellers[4], buyers[9], 'pending', 'Very urgent!'));
    orders.push(createOrder(createdBooks[21], sellers[4], buyers[9], 'confirmed', 'Standard delivery'));

    // ADDITIONAL: Create many confirmed orders for Seller1 (for route planning testing)
    for (let i = 0; i < 8; i++) {
      const bookIdx = 22 + (i % 10);
      const buyerIdx = i % buyers.length;
      if (createdBooks[bookIdx]) {
        orders.push(createOrder(createdBooks[bookIdx], sellers[0], buyers[buyerIdx], 'confirmed', `Route test order ${i + 1}`));
      }
    }

    // Create more pending orders for various sellers
    for (let i = 0; i < 5; i++) {
      const sellerIdx = i % sellers.length;
      const buyerIdx = (i + 2) % buyers.length;
      const bookIdx = 25 + i;
      if (createdBooks[bookIdx]) {
        orders.push(createOrder(createdBooks[bookIdx], sellers[sellerIdx], buyers[buyerIdx], 'pending', null));
      }
    }

    const createdOrders = await Order.insertMany(orders);
    console.log(`   ✅ Created ${createdOrders.length} orders`);

    // Update inventory for confirmed and delivered orders
    console.log('   📦 Updating inventory for confirmed/delivered orders...');
    let inventoryUpdates = 0;
    for (const order of createdOrders) {
      if (order.status === 'confirmed' || order.status === 'delivered') {
        const book = await Book.findById(order.book);
        if (book && book.quantity >= order.quantity) {
          book.quantity -= order.quantity;
          if (book.quantity === 0) {
            book.status = 'sold';
          }
          await book.save();

          // Mark order as having inventory updated
          order.inventoryUpdated = true;
          await order.save();
          inventoryUpdates++;
        }
      }
    }
    console.log(`   ✅ Updated inventory for ${inventoryUpdates} orders\n`);

    // Statistics
    const orderStats = {
      pending: createdOrders.filter(o => o.status === 'pending').length,
      confirmed: createdOrders.filter(o => o.status === 'confirmed').length,
      delivered: createdOrders.filter(o => o.status === 'delivered').length,
      refused: createdOrders.filter(o => o.status === 'refused').length
    };

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎉 SUCCESS! Extensive test data created');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('📋 Login Credentials (all passwords: aaaaaa):\n');

    console.log('SELLERS:');
    sellers.forEach(seller => {
      const sellerOrders = createdOrders.filter(o => o.seller.toString() === seller._id.toString());
      console.log(`  📧 ${seller.email}`);
      console.log(`     Location: ${seller.location.address}`);
      console.log(`     Orders: ${sellerOrders.length} (${sellerOrders.filter(o => o.status === 'confirmed').length} confirmed)`);
    });

    console.log('\nBUYERS:');
    buyers.forEach(buyer => {
      const buyerOrders = createdOrders.filter(o => o.buyer.toString() === buyer._id.toString());
      console.log(`  📧 ${buyer.email}`);
      console.log(`     Location: ${buyer.location.address}`);
      console.log(`     Orders: ${buyerOrders.length} total`);
    });

    console.log('\n📊 Summary:');
    console.log(`  👥 Users: ${sellers.length + buyers.length} (${sellers.length} sellers, ${buyers.length} buyers)`);
    console.log(`  📚 Books: ${createdBooks.length} across ${Object.keys(bookCategories).length} categories`);
    console.log(`  📦 Orders: ${createdOrders.length}`);
    console.log(`     - Pending: ${orderStats.pending}`);
    console.log(`     - Confirmed: ${orderStats.confirmed}`);
    console.log(`     - Delivered: ${orderStats.delivered}`);
    console.log(`     - Refused: ${orderStats.refused}`);

    console.log('\n🧪 Test Scenarios Included:');
    console.log('  ✅ Multiple orders from same buyer');
    console.log('  ✅ Orders in all possible statuses');
    console.log('  ✅ Orders from multiple sellers');
    console.log('  ✅ Large quantity orders');
    console.log('  ✅ Orders with special notes');
    console.log('  ✅ Same book from different sellers');
    console.log('  ✅ Many confirmed orders for route planning');
    console.log('  ✅ Diverse geographic locations');
    console.log('  ✅ Various book categories and qualities');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedExtensiveTestData();
