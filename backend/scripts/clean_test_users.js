require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function cleanTestUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const query = {
      $or: [
        { email: /test/i },
        { email: /example/i },
        { email: /debug/i },
        { email: /\d{10,}@/ },
        { email: /^customer\d+@/ },
        { email: /^buyer\d+@/ }
      ]
    };
    
    const testUsers = await User.find(query).lean();
    console.log('Found', testUsers.length, 'test users');
    
    testUsers.slice(0, 10).forEach((user, i) => {
      console.log(' ', i + 1 + '.', user.email);
    });
    
    if (!process.argv.includes('--confirm')) {
      console.log('\nRun with --confirm to delete');
      process.exit(0);
    }
    
    const result = await User.deleteMany(query);
    console.log('\nDeleted', result.deletedCount, 'test users');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanTestUsers();
