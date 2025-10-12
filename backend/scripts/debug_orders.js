require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const Book = require('../models/Book');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const customer = await User.findOne({ email: 'customer1@gmail.com' });
    console.log('Customer1 ID:', customer?._id);
    console.log('Customer1 email:', customer?.email);
    console.log('Customer1 userType:', customer?.userType);

    const allOrders = await Order.find({});
    console.log('\nTotal orders in DB:', allOrders.length);

    console.log('\n--- Order Details ---');
    allOrders.forEach((o, i) => {
      console.log(`\nOrder ${i + 1}:`);
      console.log('  customer object:', o.customer);
      console.log('  buyer object:', o.buyer);
      console.log('  book:', o.book);
      console.log('  status:', o.status);
    });

    // Check what the API endpoint is looking for
    console.log('\n--- Testing API Query ---');
    const ordersViaAPI = await Order.find({ buyer: customer._id });
    console.log('Orders found via buyer ID match:', ordersViaAPI.length);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
