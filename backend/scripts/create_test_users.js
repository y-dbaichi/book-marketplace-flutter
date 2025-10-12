require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function createTestUsers() {
  try {
    console.log('Connecting to MongoDB...\n');
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('Step 1: Deleting all users...');
    await User.deleteMany({});
    console.log('  Deleted all users\n');
    
    console.log('Step 2: Creating BUYERS (customers who place orders)...\n');
    
    const buyer1 = new User({
      email: 'buyer1@gmail.com',
      password: 'aaaaaa',
      userType: 'buyer',
      displayName: 'Youssef Hassan',
      phone: '+212600000001',
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
    
    await buyer1.save();
    console.log('✅ Created buyer1@gmail.com');
    console.log('   Testing login...');
    const test1 = await buyer1.comparePassword('aaaaaa');
    console.log('   Password test:', test1 ? '✅ SUCCESS' : '❌ FAILED');
    console.log('');
    
    const buyer2 = new User({
      email: 'buyer2@gmail.com',
      password: 'aaaaaa',
      userType: 'buyer',
      displayName: 'Khadija Alami',
      phone: '+212600000002',
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
    
    await buyer2.save();
    console.log('✅ Created buyer2@gmail.com');
    console.log('   Testing login...');
    const test2 = await buyer2.comparePassword('aaaaaa');
    console.log('   Password test:', test2 ? '✅ SUCCESS' : '❌ FAILED');
    console.log('');
    
    console.log('Step 3: Creating SELLERS (who sell books)...\n');
    
    const seller1 = new User({
      email: 'seller1@gmail.com',
      password: 'aaaaaa',
      userType: 'seller',
      displayName: 'Ahmed Books',
      phone: '+212600000003',
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
    
    await seller1.save();
    console.log('✅ Created seller1@gmail.com');
    console.log('   Testing login...');
    const test3 = await seller1.comparePassword('aaaaaa');
    console.log('   Password test:', test3 ? '✅ SUCCESS' : '❌ FAILED');
    console.log('');
    
    const seller2 = new User({
      email: 'seller2@gmail.com',
      password: 'aaaaaa',
      userType: 'seller',
      displayName: 'Fatima Library',
      phone: '+212600000004',
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
    
    await seller2.save();
    console.log('✅ Created seller2@gmail.com');
    console.log('   Testing login...');
    const test4 = await seller2.comparePassword('aaaaaa');
    console.log('   Password test:', test4 ? '✅ SUCCESS' : '❌ FAILED');
    console.log('');
    
    console.log('========================================');
    console.log('SUMMARY');
    console.log('========================================');
    console.log('');
    console.log('All accounts created with password: aaaaaa');
    console.log('');
    console.log('BUYERS (can place orders):');
    console.log('  buyer1@gmail.com - Youssef Hassan (Casablanca)');
    console.log('  buyer2@gmail.com - Khadija Alami (Rabat)');
    console.log('');
    console.log('SELLERS (sell books):');
    console.log('  seller1@gmail.com - Ahmed Books (Casablanca)');
    console.log('  seller2@gmail.com - Fatima Library (Rabat)');
    console.log('');
    
    if (test1 && test2 && test3 && test4) {
      console.log('✅ All password tests passed!');
      console.log('✅ You can now login with any account');
    } else {
      console.log('❌ Some password tests failed - check above');
    }
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestUsers();
