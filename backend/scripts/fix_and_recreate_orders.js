require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Book = require('../models/Book');
const Order = require('../models/Order');

async function run() {
  try {
    console.log('🔌 Connecting MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);

    // Delete all existing orders
    console.log('🧹 Removing all existing orders...');
    const delRes = await Order.deleteMany({});
    console.log(`   Deleted: ${delRes.deletedCount} order(s)`);

    // Find sellers
    const sellers = await User.find({
      email: { $in: ['seller1@gmail.com', 'seller2@gmail.com'] },
      userType: 'seller'
    });

    if (sellers.length < 2) {
      console.error('❌ Missing seller accounts');
      process.exit(1);
    }

    // Find customers
    const customers = await User.find({
      email: { $in: ['customer1@gmail.com', 'customer2@gmail.com', 'customer3@gmail.com'] },
      userType: 'buyer'
    });

    console.log(`✅ Found ${customers.length} customers`);

    // Get all available books from sellers
    const books = await Book.find({
      seller: { $in: sellers.map(s => s._id) },
      status: 'available',
      quantity: { $gt: 0 }
    }).populate('seller');

    console.log(`📚 Found ${books.length} available books`);

    // Create orders with CORRECT schema - buyer and seller as ObjectId references
    const orders = [];
    const orderStatuses = ['pending', 'confirmed', 'delivered'];

    // Customer 1 orders 2 books
    if (books.length > 0 && customers[0]) {
      orders.push({
        book: books[0]._id,
        seller: books[0].seller._id,  // ObjectId reference
        buyer: customers[0]._id,      // ObjectId reference
        quantity: 1,
        totalPrice: books[0].price * 1,
        buyerNotes: 'Please deliver between 2-5 PM',
        status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
        buyerLocation: {
          type: 'Point',
          coordinates: [
            customers[0].location.coordinates.longitude,
            customers[0].location.coordinates.latitude
          ],
          name: customers[0].location.name,
          address: customers[0].location.address
        },
        sellerLocation: books[0].seller.location ? {
          type: 'Point',
          coordinates: [
            books[0].seller.location.coordinates.longitude,
            books[0].seller.location.coordinates.latitude
          ],
          name: books[0].seller.location.name,
          address: books[0].seller.location.address
        } : undefined
      });
    }

    if (books.length > 1 && customers[0]) {
      orders.push({
        book: books[1]._id,
        seller: books[1].seller._id,
        buyer: customers[0]._id,
        quantity: 2,
        totalPrice: books[1].price * 2,
        buyerNotes: 'I will pick up tomorrow morning',
        status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
        buyerLocation: {
          type: 'Point',
          coordinates: [
            customers[0].location.coordinates.longitude,
            customers[0].location.coordinates.latitude
          ],
          name: customers[0].location.name,
          address: customers[0].location.address
        },
        sellerLocation: books[1].seller.location ? {
          type: 'Point',
          coordinates: [
            books[1].seller.location.coordinates.longitude,
            books[1].seller.location.coordinates.latitude
          ],
          name: books[1].seller.location.name,
          address: books[1].seller.location.address
        } : undefined
      });
    }

    // Customer 2 orders 1 book
    if (books.length > 2 && customers[1]) {
      orders.push({
        book: books[2]._id,
        seller: books[2].seller._id,
        buyer: customers[1]._id,
        quantity: 1,
        totalPrice: books[2].price * 1,
        buyerNotes: 'Call before delivery',
        status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
        buyerLocation: {
          type: 'Point',
          coordinates: [
            customers[1].location.coordinates.longitude,
            customers[1].location.coordinates.latitude
          ],
          name: customers[1].location.name,
          address: customers[1].location.address
        },
        sellerLocation: books[2].seller.location ? {
          type: 'Point',
          coordinates: [
            books[2].seller.location.coordinates.longitude,
            books[2].seller.location.coordinates.latitude
          ],
          name: books[2].seller.location.name,
          address: books[2].seller.location.address
        } : undefined
      });
    }

    // Customer 3 orders 2 books
    if (books.length > 3 && customers[2]) {
      orders.push({
        book: books[3]._id,
        seller: books[3].seller._id,
        buyer: customers[2]._id,
        quantity: 1,
        totalPrice: books[3].price * 1,
        status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
        buyerLocation: {
          type: 'Point',
          coordinates: [
            customers[2].location.coordinates.longitude,
            customers[2].location.coordinates.latitude
          ],
          name: customers[2].location.name,
          address: customers[2].location.address
        },
        sellerLocation: books[3].seller.location ? {
          type: 'Point',
          coordinates: [
            books[3].seller.location.coordinates.longitude,
            books[3].seller.location.coordinates.latitude
          ],
          name: books[3].seller.location.name,
          address: books[3].seller.location.address
        } : undefined
      });
    }

    if (books.length > 4 && customers[2]) {
      orders.push({
        book: books[4]._id,
        seller: books[4].seller._id,
        buyer: customers[2]._id,
        quantity: 1,
        totalPrice: books[4].price * 1,
        buyerNotes: 'Urgent order',
        status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
        buyerLocation: {
          type: 'Point',
          coordinates: [
            customers[2].location.coordinates.longitude,
            customers[2].location.coordinates.latitude
          ],
          name: customers[2].location.name,
          address: customers[2].location.address
        },
        sellerLocation: books[4].seller.location ? {
          type: 'Point',
          coordinates: [
            books[4].seller.location.coordinates.longitude,
            books[4].seller.location.coordinates.latitude
          ],
          name: books[4].seller.location.name,
          address: books[4].seller.location.address
        } : undefined
      });
    }

    console.log('📦 Creating orders with correct schema...');
    const inserted = await Order.insertMany(orders);
    console.log(`   Inserted: ${inserted.length} order(s)`);

    // Verify
    console.log('\n✅ Verifying orders can be queried correctly...');
    for (const customer of customers) {
      const customerOrders = await Order.find({ buyer: customer._id })
        .populate('book', 'title')
        .populate('seller', 'email');
      console.log(`   ${customer.email}: ${customerOrders.length} order(s)`);
      customerOrders.forEach(o => {
        console.log(`      - "${o.book?.title}" from ${o.seller?.email} - Status: ${o.status}`);
      });
    }

    console.log('\n✅ Done! Orders recreated with correct schema.');
    process.exit(0);
  } catch (err) {
    console.error('💥 Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

run();
