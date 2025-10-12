const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  buyer: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: String,
    email: String
  },
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'delivered', 'refused'],
    default: 'pending',
    required: true
  },
  customerLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    name: String,
    address: String
  },
  buyerLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number],
    name: String,
    address: String
  },
  customerNotes: {
    type: String,
    maxlength: 500
  },
  buyerNotes: {
    type: String,
    maxlength: 500
  },
  exportedToGeoJSON: {
    type: Boolean,
    default: false
  },
  lastExportedAt: Date
}, {
  timestamps: true
});

orderSchema.index({ 'buyer.user': 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ customerLocation: '2dsphere' });

orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.buyerLocation) {
    try {
      const User = mongoose.model('User');
      const buyer = await User.findById(this.buyer.user);
      if (buyer && buyer.location) {
        this.buyerLocation = {
          type: 'Point',
          coordinates: buyer.location.coordinates.coordinates || buyer.location.coordinates,
          name: buyer.location.name,
          address: buyer.location.address
        };
      }
    } catch (error) {
      console.error('Error populating buyer location:', error);
    }
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
