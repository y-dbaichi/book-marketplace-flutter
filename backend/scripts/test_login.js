require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function testLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('Testing login for: buyer1@gmail.com\n');
    
    const user = await User.findOne({ email: 'buyer1@gmail.com' });
    
    if (!user) {
      console.log('ERROR: User not found!');
      process.exit(1);
    }
    
    console.log('User found:');
    console.log('  Email:', user.email);
    console.log('  UserType:', user.userType);
    console.log('  DisplayName:', user.displayName);
    console.log('  Password hash:', user.password.substring(0, 20) + '...');
    console.log('');
    
    const isMatch = await bcrypt.compare('aaaaaa', user.password);
    
    console.log('Password test:');
    console.log('  Testing password: aaaaaa');
    console.log('  Match result:', isMatch ? 'SUCCESS' : 'FAILED');
    console.log('');
    
    if (isMatch) {
      console.log('Login credentials are correct!');
      console.log('');
      console.log('If login still fails in frontend, check:');
      console.log('1. Is backend running on port 5001?');
      console.log('2. Open browser console and check the exact error message');
      console.log('3. Check Network tab to see what data is being sent');
    } else {
      console.log('ERROR: Password does not match!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testLogin();
