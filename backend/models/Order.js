const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  buyerLocation: {
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
  sellerLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number],
    name: String,
    address: String
  },
  buyerNotes: {
    type: String,
    maxlength: 500
  },
  sellerNotes: {
    type: String,
    maxlength: 500
  },
  exportedToGeoJSON: {
    type: Boolean,
    default: false
  },
  lastExportedAt: Date,
  inventoryUpdated: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

orderSchema.index({ seller: 1, status: 1 });
orderSchema.index({ buyer: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ buyerLocation: '2dsphere' });

orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.sellerLocation) {
    try {
      const User = mongoose.model('User');
      const seller = await User.findById(this.seller);
      if (seller && seller.location) {
        this.sellerLocation = {
          type: 'Point',
          coordinates: seller.location.coordinates.coordinates || seller.location.coordinates,
          name: seller.location.name,
          address: seller.location.address
        };
      }
    } catch (error) {
      console.error('Error populating seller location:', error);
    }
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
