require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Book = require('../models/Book');
const Order = require('../models/Order');

async function resetAndSeed() {
  try {
    console.log('Connecting to MongoDB...\n');
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('Step 1: Deleting ALL data...');
    await User.deleteMany({});
    await Book.deleteMany({});
    await Order.deleteMany({});
    console.log('  Deleted all users, books, and orders\n');
    
    console.log('Step 2: Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('aaaaaa', salt);
    console.log('  Password hashed successfully\n');
    
    console.log('Step 3: Creating users...');
    
    const seller1 = await User.create({
      email: 'seller1@gmail.com',
      password: hashedPassword,
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
      password: hashedPassword,
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
    
    console.log('  Created 2 sellers:');
    console.log('    - seller1@gmail.com (Ahmed Books, Casablanca)');
    console.log('    - seller2@gmail.com (Fatima Library, Rabat)');
    
    const buyer1 = await User.create({
      email: 'buyer1@gmail.com',
      password: hashedPassword,
      userType: 'buyer',
      displayName: 'Youssef Hassan',
      phone: '+212600000003',
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
      password: hashedPassword,
      userType: 'buyer',
      displayName: 'Khadija Alami',
      phone: '+212600000004',
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
    
    console.log('  Created 2 buyers:');
    console.log('    - buyer1@gmail.com (Youssef Hassan, Casablanca)');
    console.log('    - buyer2@gmail.com (Khadija Alami, Rabat)\n');
    
    console.log('Step 4: Verifying password...');
    const testUser = await User.findOne({ email: 'buyer1@gmail.com' });
    const passwordWorks = await bcrypt.compare('aaaaaa', testUser.password);
    if (passwordWorks) {
      console.log('  Password verification: SUCCESS\n');
    } else {
      console.log('  Password verification: FAILED - Something is wrong!\n');
      process.exit(1);
    }
    
    console.log('Step 5: Creating books...');
    
    const seller1Books = [
      {
        title: 'The Alchemist',
        author: 'Paulo Coelho',
        description: 'A magical tale about following your dreams',
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
        description: 'A brief history of humankind',
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
        description: 'Tiny changes, remarkable results',
        price: 95,
        quantity: 8,
        quality: 'excellent',
        category: 'Self-Help',
        status: 'available',
        seller: seller1._id
      }
    ];
    
    const seller2Books = [
      {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        description: 'Classic American novel',
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
        description: 'A memoir about self-invention',
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
        description: 'The classic guide to success',
        price: 75,
        quantity: 6,
        quality: 'good',
        category: 'Business',
        status: 'available',
        seller: seller2._id
      }
    ];
    
    await Book.insertMany([...seller1Books, ...seller2Books]);
    
    console.log('  Created 6 books:');
    console.log('    Seller 1 (Ahmed Books):');
    console.log('      - The Alchemist (85 MAD, 5 qty)');
    console.log('      - Sapiens (120 MAD, 3 qty)');
    console.log('      - Atomic Habits (95 MAD, 8 qty)');
    console.log('    Seller 2 (Fatima Library):');
    console.log('      - The Great Gatsby (65 MAD, 4 qty)');
    console.log('      - Educated (110 MAD, 2 qty)');
    console.log('      - Think and Grow Rich (75 MAD, 6 qty)\n');
    
    console.log('========================================');
    console.log('SUCCESS! Database reset and seeded');
    console.log('========================================\n');
    
    console.log('Login Credentials (all passwords: aaaaaa):');
    console.log('');
    console.log('SELLERS (can add/manage books):');
    console.log('  seller1@gmail.com / aaaaaa');
    console.log('  seller2@gmail.com / aaaaaa');
    console.log('');
    console.log('BUYERS (can place orders):');
    console.log('  buyer1@gmail.com / aaaaaa');
    console.log('  buyer2@gmail.com / aaaaaa');
    console.log('');
    console.log('Summary:');
    console.log('  Users: 4 (2 sellers, 2 buyers)');
    console.log('  Books: 6 (3 per seller)');
    console.log('  Orders: 0 (ready for testing)');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetAndSeed();
