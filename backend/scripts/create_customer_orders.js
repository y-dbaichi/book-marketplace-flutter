require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Book = require('../models/Book');
const Order = require('../models/Order');

async function run() {
  try {
    console.log('🔌 Connecting MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);

    // Find sellers (users with userType 'buyer' who have books)
    const sellers = await User.find({
      email: { $in: ['seller1@gmail.com', 'seller2@gmail.com'] },
      userType: 'buyer'
    });

    if (sellers.length < 2) {
      console.error('❌ Missing seller accounts. Need both seller1@gmail.com & seller2@gmail.com');
      process.exit(1);
    }

    // Find or create customers
    const customerEmails = ['customer1@gmail.com', 'customer2@gmail.com', 'customer3@gmail.com'];
    const customers = [];

    for (const email of customerEmails) {
      let customer = await User.findOne({ email, userType: 'customer' });

      if (!customer) {
        console.log(`📝 Creating customer: ${email}`);
        customer = new User({
          email,
          password: 'password123',
          userType: 'customer',
          phone: '+212' + Math.floor(Math.random() * 1000000000),
          profile: {
            firstName: email.split('@')[0].replace(/\d+/g, ''),
            lastName: 'TestUser'
          },
          location: {
            name: 'Customer Location',
            address: `${Math.floor(Math.random() * 100)} Test Street, City`,
            coordinates: {
              latitude: 33.5731 + (Math.random() - 0.5) * 0.1,
              longitude: -7.5898 + (Math.random() - 0.5) * 0.1
            }
          }
        });
        await customer.save();
      }
      customers.push(customer);
    }

    console.log(`✅ Found/created ${customers.length} customers`);

    // Get all available books from sellers
    const books = await Book.find({
      buyer: { $in: sellers.map(s => s._id) },
      status: 'available',
      quantity: { $gt: 0 }
    }).populate('buyer');

    if (books.length === 0) {
      console.error('❌ No available books found from sellers');
      process.exit(1);
    }

    console.log(`📚 Found ${books.length} available books`);

    // Clean up existing orders by email
    console.log('🧹 Removing existing orders from these customers...');
    const delRes = await Order.deleteMany({
      'customer.email': { $in: customers.map(c => c.email) }
    });
    console.log(`   Deleted: ${delRes.deletedCount} order(s)`);

    // Create orders
    const orders = [];
    const orderStatuses = ['pending', 'confirmed', 'delivered'];

    // Customer 1 orders 2 books
    if (books.length > 0) {
      orders.push({
        book: books[0]._id,
        buyer: {
          user: books[0].buyer._id,
          name: `${books[0].buyer.profile.firstName} ${books[0].buyer.profile.lastName}`,
          email: books[0].buyer.email
        },
        customer: {
          name: `${customers[0].profile.firstName} ${customers[0].profile.lastName}`,
          email: customers[0].email,
          phone: customers[0].phone
        },
        quantity: 1,
        totalPrice: books[0].price * 1,
        customerNotes: 'Please deliver between 2-5 PM',
        status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
        customerLocation: {
          type: 'Point',
          coordinates: [
            customers[0].location.coordinates.longitude,
            customers[0].location.coordinates.latitude
          ],
          name: customers[0].location.name,
          address: customers[0].location.address
        },
        buyerLocation: books[0].buyer.location ? {
          type: 'Point',
          coordinates: [
            books[0].buyer.location.coordinates.longitude,
            books[0].buyer.location.coordinates.latitude
          ],
          name: books[0].buyer.location.name,
          address: books[0].buyer.location.address
        } : undefined
      });
    }

    if (books.length > 1) {
      orders.push({
        book: books[1]._id,
        buyer: {
          user: books[1].buyer._id,
          name: `${books[1].buyer.profile.firstName} ${books[1].buyer.profile.lastName}`,
          email: books[1].buyer.email
        },
        customer: {
          name: `${customers[0].profile.firstName} ${customers[0].profile.lastName}`,
          email: customers[0].email,
          phone: customers[0].phone
        },
        quantity: 2,
        totalPrice: books[1].price * 2,
        customerNotes: 'I will pick up tomorrow morning',
        status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
        customerLocation: {
          type: 'Point',
          coordinates: [
            customers[0].location.coordinates.longitude,
            customers[0].location.coordinates.latitude
          ],
          name: customers[0].location.name,
          address: customers[0].location.address
        },
        buyerLocation: books[1].buyer.location ? {
          type: 'Point',
          coordinates: [
            books[1].buyer.location.coordinates.longitude,
            books[1].buyer.location.coordinates.latitude
          ],
          name: books[1].buyer.location.name,
          address: books[1].buyer.location.address
        } : undefined
      });
    }

    // Customer 2 orders 1 book
    if (books.length > 2) {
      orders.push({
        book: books[2]._id,
        buyer: {
          user: books[2].buyer._id,
          name: `${books[2].buyer.profile.firstName} ${books[2].buyer.profile.lastName}`,
          email: books[2].buyer.email
        },
        customer: {
          name: `${customers[1].profile.firstName} ${customers[1].profile.lastName}`,
          email: customers[1].email,
          phone: customers[1].phone
        },
        quantity: 1,
        totalPrice: books[2].price * 1,
        customerNotes: 'Call before delivery',
        status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
        customerLocation: {
          type: 'Point',
          coordinates: [
            customers[1].location.coordinates.longitude,
            customers[1].location.coordinates.latitude
          ],
          name: customers[1].location.name,
          address: customers[1].location.address
        },
        buyerLocation: books[2].buyer.location ? {
          type: 'Point',
          coordinates: [
            books[2].buyer.location.coordinates.longitude,
            books[2].buyer.location.coordinates.latitude
          ],
          name: books[2].buyer.location.name,
          address: books[2].buyer.location.address
        } : undefined
      });
    }

    // Customer 3 orders 2 books
    if (books.length > 3) {
      orders.push({
        book: books[3]._id,
        buyer: {
          user: books[3].buyer._id,
          name: `${books[3].buyer.profile.firstName} ${books[3].buyer.profile.lastName}`,
          email: books[3].buyer.email
        },
        customer: {
          name: `${customers[2].profile.firstName} ${customers[2].profile.lastName}`,
          email: customers[2].email,
          phone: customers[2].phone
        },
        quantity: 1,
        totalPrice: books[3].price * 1,
        status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
        customerLocation: {
          type: 'Point',
          coordinates: [
            customers[2].location.coordinates.longitude,
            customers[2].location.coordinates.latitude
          ],
          name: customers[2].location.name,
          address: customers[2].location.address
        },
        buyerLocation: books[3].buyer.location ? {
          type: 'Point',
          coordinates: [
            books[3].buyer.location.coordinates.longitude,
            books[3].buyer.location.coordinates.latitude
          ],
          name: books[3].buyer.location.name,
          address: books[3].buyer.location.address
        } : undefined
      });
    }

    if (books.length > 4) {
      orders.push({
        book: books[4]._id,
        buyer: {
          user: books[4].buyer._id,
          name: `${books[4].buyer.profile.firstName} ${books[4].buyer.profile.lastName}`,
          email: books[4].buyer.email
        },
        customer: {
          name: `${customers[2].profile.firstName} ${customers[2].profile.lastName}`,
          email: customers[2].email,
          phone: customers[2].phone
        },
        quantity: 1,
        totalPrice: books[4].price * 1,
        customerNotes: 'Urgent order',
        status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
        customerLocation: {
          type: 'Point',
          coordinates: [
            customers[2].location.coordinates.longitude,
            customers[2].location.coordinates.latitude
          ],
          name: customers[2].location.name,
          address: customers[2].location.address
        },
        buyerLocation: books[4].buyer.location ? {
          type: 'Point',
          coordinates: [
            books[4].buyer.location.coordinates.longitude,
            books[4].buyer.location.coordinates.latitude
          ],
          name: books[4].buyer.location.name,
          address: books[4].buyer.location.address
        } : undefined
      });
    }

    console.log('📦 Creating orders...');
    const inserted = await Order.insertMany(orders);
    console.log(`   Inserted: ${inserted.length} order(s)`);

    // Summary
    console.log('\n📊 Order Summary:');
    for (let i = 0; i < customers.length; i++) {
      const customerOrders = inserted.filter(o =>
        o.customer.email === customers[i].email
      );
      console.log(`   ${customers[i].email}: ${customerOrders.length} order(s)`);
      customerOrders.forEach(order => {
        const book = books.find(b => b._id.toString() === order.book.toString());
        console.log(`      - "${book?.title}" (${order.quantity}x) - Status: ${order.status}`);
      });
    }

    console.log('\n✅ Done. Customer orders created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('💥 Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

run();
