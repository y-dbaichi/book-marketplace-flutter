require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Book = require('../models/Book');
const Order = require('../models/Order');

async function resetAndSeed() {
  try {
    console.log('🔌 Connecting to MongoDB...\n');
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('🗑️  Step 1: Deleting ALL data...');
    await User.deleteMany({});
    await Book.deleteMany({});
    await Order.deleteMany({});
    console.log('   ✅ Deleted all users, books, and orders\n');

    console.log('👥 Step 2: Creating users...');

    // Create sellers (password will be auto-hashed by the model)
    const seller1 = await User.create({
      email: 'seller1@gmail.com',
      password: 'aaaaaa',
      userType: 'seller',
      displayName: 'Ahmed Books',
      phone: '+212600000001',
      profile: {
        firstName: 'Ahmed',
        lastName: 'Books'
      },
      location: {
        name: 'Librairie Centrale',
        address: 'Boulevard Mohammed V, Casablanca',
        coordinates: {
          latitude: 33.5731,
          longitude: -7.6298
        }
      }
    });

    const seller2 = await User.create({
      email: 'seller2@gmail.com',
      password: 'aaaaaa',
      userType: 'seller',
      displayName: 'Fatima Library',
      phone: '+212600000002',
      profile: {
        firstName: 'Fatima',
        lastName: 'Library'
      },
      location: {
        name: 'Librairie Al Houda',
        address: 'Rue de la Liberté, Rabat',
        coordinates: {
          latitude: 33.9716,
          longitude: -6.8498
        }
      }
    });

    const seller3 = await User.create({
      email: 'seller3@gmail.com',
      password: 'aaaaaa',
      userType: 'seller',
      displayName: 'Karim Books',
      phone: '+212600000003',
      profile: {
        firstName: 'Karim',
        lastName: 'Benani'
      },
      location: {
        name: 'Librairie Universitaire',
        address: 'Avenue Hassan II, Fes',
        coordinates: {
          latitude: 34.0331,
          longitude: -5.0003
        }
      }
    });

    console.log('   ✅ Created 3 sellers:');
    console.log('      - seller1@gmail.com (Ahmed Books, Casablanca)');
    console.log('      - seller2@gmail.com (Fatima Library, Rabat)');
    console.log('      - seller3@gmail.com (Karim Books, Fes)');

    const buyer1 = await User.create({
      email: 'buyer1@gmail.com',
      password: 'aaaaaa',
      userType: 'buyer',
      displayName: 'Youssef Hassan',
      phone: '+212600000010',
      profile: {
        firstName: 'Youssef',
        lastName: 'Hassan'
      },
      location: {
        name: 'Home',
        address: 'Quartier Maarif, Casablanca',
        coordinates: {
          latitude: 33.5731,
          longitude: -7.6256
        }
      }
    });

    const buyer2 = await User.create({
      email: 'buyer2@gmail.com',
      password: 'aaaaaa',
      userType: 'buyer',
      displayName: 'Khadija Alami',
      phone: '+212600000011',
      profile: {
        firstName: 'Khadija',
        lastName: 'Alami'
      },
      location: {
        name: 'Home',
        address: 'Agdal, Rabat',
        coordinates: {
          latitude: 33.9715,
          longitude: -6.8344
        }
      }
    });

    const buyer3 = await User.create({
      email: 'buyer3@gmail.com',
      password: 'aaaaaa',
      userType: 'buyer',
      displayName: 'Mehdi Tazi',
      phone: '+212600000012',
      profile: {
        firstName: 'Mehdi',
        lastName: 'Tazi'
      },
      location: {
        name: 'Apartment',
        address: 'Hay Riad, Rabat',
        coordinates: {
          latitude: 33.9650,
          longitude: -6.8600
        }
      }
    });

    const buyer4 = await User.create({
      email: 'buyer4@gmail.com',
      password: 'aaaaaa',
      userType: 'buyer',
      displayName: 'Sara Bennani',
      phone: '+212600000013',
      profile: {
        firstName: 'Sara',
        lastName: 'Bennani'
      },
      location: {
        name: 'Office',
        address: 'Anfa, Casablanca',
        coordinates: {
          latitude: 33.5800,
          longitude: -7.6300
        }
      }
    });

    console.log('   ✅ Created 4 buyers:');
    console.log('      - buyer1@gmail.com (Youssef Hassan, Casablanca)');
    console.log('      - buyer2@gmail.com (Khadija Alami, Rabat)');
    console.log('      - buyer3@gmail.com (Mehdi Tazi, Rabat)');
    console.log('      - buyer4@gmail.com (Sara Bennani, Casablanca)\n');

    console.log('📚 Step 3: Creating books...');

    const seller1Books = [
      {
        title: 'The Alchemist',
        author: 'Paulo Coelho',
        description: 'A magical tale about following your dreams and finding your personal legend',
        price: 85,
        quantity: 5,
        quality: 'excellent',
        category: 'Fiction',
        status: 'available',
        seller: seller1._id
      },
      {
        title: 'Sapiens',
        author: 'Yuval Noah Harari',
        description: 'A brief history of humankind from the Stone Age to modern times',
        price: 120,
        quantity: 3,
        quality: 'good',
        category: 'History',
        status: 'available',
        seller: seller1._id
      },
      {
        title: 'Atomic Habits',
        author: 'James Clear',
        description: 'Tiny changes, remarkable results - an easy guide to building good habits',
        price: 95,
        quantity: 8,
        quality: 'excellent',
        category: 'Self-Help',
        status: 'available',
        seller: seller1._id
      },
      {
        title: '1984',
        author: 'George Orwell',
        description: 'A dystopian social science fiction novel',
        price: 70,
        quantity: 4,
        quality: 'good',
        category: 'Fiction',
        status: 'available',
        seller: seller1._id
      }
    ];

    const seller2Books = [
      {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        description: 'Classic American novel about the Jazz Age',
        price: 65,
        quantity: 4,
        quality: 'good',
        category: 'Fiction',
        status: 'available',
        seller: seller2._id
      },
      {
        title: 'Educated',
        author: 'Tara Westover',
        description: 'A memoir about self-invention and the pursuit of knowledge',
        price: 110,
        quantity: 2,
        quality: 'excellent',
        category: 'Biography',
        status: 'available',
        seller: seller2._id
      },
      {
        title: 'Think and Grow Rich',
        author: 'Napoleon Hill',
        description: 'The classic guide to success and wealth building',
        price: 75,
        quantity: 6,
        quality: 'good',
        category: 'Business',
        status: 'available',
        seller: seller2._id
      },
      {
        title: 'Rich Dad Poor Dad',
        author: 'Robert Kiyosaki',
        description: 'What the rich teach their kids about money',
        price: 80,
        quantity: 5,
        quality: 'excellent',
        category: 'Business',
        status: 'available',
        seller: seller2._id
      }
    ];

    const seller3Books = [
      {
        title: 'The 48 Laws of Power',
        author: 'Robert Greene',
        description: 'The definitive book on power and strategy',
        price: 130,
        quantity: 3,
        quality: 'excellent',
        category: 'Self-Help',
        status: 'available',
        seller: seller3._id
      },
      {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        description: 'A classic of modern American literature',
        price: 60,
        quantity: 7,
        quality: 'good',
        category: 'Fiction',
        status: 'available',
        seller: seller3._id
      },
      {
        title: 'The Lean Startup',
        author: 'Eric Ries',
        description: 'How constant innovation creates radically successful businesses',
        price: 100,
        quantity: 4,
        quality: 'excellent',
        category: 'Business',
        status: 'available',
        seller: seller3._id
      },
      {
        title: 'Meditations',
        author: 'Marcus Aurelius',
        description: 'Timeless wisdom from a Roman emperor and philosopher',
        price: 55,
        quantity: 6,
        quality: 'good',
        category: 'Philosophy',
        status: 'available',
        seller: seller3._id
      }
    ];

    const allBooks = await Book.insertMany([...seller1Books, ...seller2Books, ...seller3Books]);

    console.log('   ✅ Created 12 books:');
    console.log('      Seller 1 (Ahmed Books): 4 books');
    console.log('      Seller 2 (Fatima Library): 4 books');
    console.log('      Seller 3 (Karim Books): 4 books\n');

    console.log('📦 Step 4: Creating orders...');

    // Get books for orders
    const book1 = allBooks[0];  // The Alchemist
    const book2 = allBooks[1];  // Sapiens
    const book3 = allBooks[4];  // The Great Gatsby
    const book4 = allBooks[5];  // Educated
    const book5 = allBooks[8];  // The 48 Laws of Power
    const book6 = allBooks[10]; // The Lean Startup

    const orders = [
      // Buyer 1 orders
      {
        book: book1._id,
        seller: seller1._id,
        buyer: buyer1._id,
        quantity: 1,
        totalPrice: book1.price * 1,
        buyerNotes: 'Please deliver between 2-5 PM',
        status: 'pending',
        buyerLocation: {
          type: 'Point',
          coordinates: [buyer1.location.coordinates.longitude, buyer1.location.coordinates.latitude],
          name: buyer1.location.name,
          address: buyer1.location.address
        },
        sellerLocation: {
          type: 'Point',
          coordinates: [seller1.location.coordinates.longitude, seller1.location.coordinates.latitude],
          name: seller1.location.name,
          address: seller1.location.address
        }
      },
      // Buyer 2 orders
      {
        book: book3._id,
        seller: seller2._id,
        buyer: buyer2._id,
        quantity: 1,
        totalPrice: book3.price * 1,
        buyerNotes: 'Call before delivery',
        status: 'confirmed',
        buyerLocation: {
          type: 'Point',
          coordinates: [buyer2.location.coordinates.longitude, buyer2.location.coordinates.latitude],
          name: buyer2.location.name,
          address: buyer2.location.address
        },
        sellerLocation: {
          type: 'Point',
          coordinates: [seller2.location.coordinates.longitude, seller2.location.coordinates.latitude],
          name: seller2.location.name,
          address: seller2.location.address
        }
      },
      {
        book: book4._id,
        seller: seller2._id,
        buyer: buyer2._id,
        quantity: 1,
        totalPrice: book4.price * 1,
        status: 'delivered',
        buyerLocation: {
          type: 'Point',
          coordinates: [buyer2.location.coordinates.longitude, buyer2.location.coordinates.latitude],
          name: buyer2.location.name,
          address: buyer2.location.address
        },
        sellerLocation: {
          type: 'Point',
          coordinates: [seller2.location.coordinates.longitude, seller2.location.coordinates.latitude],
          name: seller2.location.name,
          address: seller2.location.address
        }
      },
      // Buyer 3 orders
      {
        book: book5._id,
        seller: seller3._id,
        buyer: buyer3._id,
        quantity: 2,
        totalPrice: book5.price * 2,
        buyerNotes: 'Urgent order, please hurry',
        status: 'pending',
        buyerLocation: {
          type: 'Point',
          coordinates: [buyer3.location.coordinates.longitude, buyer3.location.coordinates.latitude],
          name: buyer3.location.name,
          address: buyer3.location.address
        },
        sellerLocation: {
          type: 'Point',
          coordinates: [seller3.location.coordinates.longitude, seller3.location.coordinates.latitude],
          name: seller3.location.name,
          address: seller3.location.address
        }
      },
      // Buyer 4 orders
      {
        book: book2._id,
        seller: seller1._id,
        buyer: buyer4._id,
        quantity: 1,
        totalPrice: book2.price * 1,
        status: 'confirmed',
        buyerLocation: {
          type: 'Point',
          coordinates: [buyer4.location.coordinates.longitude, buyer4.location.coordinates.latitude],
          name: buyer4.location.name,
          address: buyer4.location.address
        },
        sellerLocation: {
          type: 'Point',
          coordinates: [seller1.location.coordinates.longitude, seller1.location.coordinates.latitude],
          name: seller1.location.name,
          address: seller1.location.address
        }
      },
      {
        book: book6._id,
        seller: seller3._id,
        buyer: buyer4._id,
        quantity: 1,
        totalPrice: book6.price * 1,
        buyerNotes: 'Leave with reception desk',
        status: 'pending',
        buyerLocation: {
          type: 'Point',
          coordinates: [buyer4.location.coordinates.longitude, buyer4.location.coordinates.latitude],
          name: buyer4.location.name,
          address: buyer4.location.address
        },
        sellerLocation: {
          type: 'Point',
          coordinates: [seller3.location.coordinates.longitude, seller3.location.coordinates.latitude],
          name: seller3.location.name,
          address: seller3.location.address
        }
      }
    ];

    await Order.insertMany(orders);

    console.log('   ✅ Created 6 orders:');
    console.log('      - 2 pending orders');
    console.log('      - 2 confirmed orders');
    console.log('      - 2 delivered orders\n');

    console.log('═'.repeat(70));
    console.log('🎉 SUCCESS! Database reset and seeded with fresh data');
    console.log('═'.repeat(70));
    console.log('\n📋 Login Credentials (all passwords: aaaaaa):\n');
    console.log('SELLERS (can manage books and view orders):');
    console.log('  📧 seller1@gmail.com / aaaaaa  (Ahmed Books, Casablanca)');
    console.log('  📧 seller2@gmail.com / aaaaaa  (Fatima Library, Rabat)');
    console.log('  📧 seller3@gmail.com / aaaaaa  (Karim Books, Fes)');
    console.log('');
    console.log('BUYERS (can browse and order books):');
    console.log('  📧 buyer1@gmail.com / aaaaaa   (Youssef Hassan, Casablanca)');
    console.log('  📧 buyer2@gmail.com / aaaaaa   (Khadija Alami, Rabat)');
    console.log('  📧 buyer3@gmail.com / aaaaaa   (Mehdi Tazi, Rabat)');
    console.log('  📧 buyer4@gmail.com / aaaaaa   (Sara Bennani, Casablanca)');
    console.log('');
    console.log('📊 Summary:');
    console.log('  👥 Users: 7 (3 sellers, 4 buyers)');
    console.log('  📚 Books: 12 (4 per seller)');
    console.log('  📦 Orders: 6 (2 pending, 2 confirmed, 2 delivered)');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetAndSeed();
