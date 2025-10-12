require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function createSellers() {
  try {
    console.log('Connecting to MongoDB...\n');
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('Creating SELLERS (who sell books)...\n');
    
    const seller1 = new User({
      email: 'seller1@gmail.com',
      password: 'aaaaaa',
      userType: 'buyer',
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
    
    await seller1.save();
    console.log('✅ Created seller1@gmail.com');
    console.log('   Name: Ahmed Books');
    console.log('   Location: Casablanca');
    console.log('   Testing login...');
    const test1 = await seller1.comparePassword('aaaaaa');
    console.log('   Password test:', test1 ? '✅ SUCCESS' : '❌ FAILED');
    console.log('');
    
    const seller2 = new User({
      email: 'seller2@gmail.com',
      password: 'aaaaaa',
      userType: 'buyer',
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
    
    await seller2.save();
    console.log('✅ Created seller2@gmail.com');
    console.log('   Name: Fatima Library');
    console.log('   Location: Rabat');
    console.log('   Testing login...');
    const test2 = await seller2.comparePassword('aaaaaa');
    console.log('   Password test:', test2 ? '✅ SUCCESS' : '❌ FAILED');
    console.log('');
    
    console.log('========================================');
    console.log('SELLERS CREATED');
    console.log('========================================');
    console.log('');
    console.log('Login with password: aaaaaa');
    console.log('');
    console.log('seller1@gmail.com - Ahmed Books (Casablanca)');
    console.log('seller2@gmail.com - Fatima Library (Rabat)');
    console.log('');
    
    if (test1 && test2) {
      console.log('✅ All password tests passed! Ready to login.');
    } else {
      console.log('❌ Password tests failed');
    }
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createSellers();
