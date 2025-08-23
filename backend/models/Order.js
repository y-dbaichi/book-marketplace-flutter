const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Order participants
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  
  // Order details
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
  
  // Order type and delivery
  orderType: {
    type: String,
    enum: ['pickup', 'delivery'],
    required: true
  },
  
  // Locations for GeoJSON generation
  locations: {
    // Buyer's location (where customer picks up or delivery starts)
    buyerLocation: {
      name: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      },
      address: String
    },
    // Customer's location (for delivery orders)
    customerLocation: {
      name: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      },
      address: String
    }
  },
  
  // Order workflow status
  status: {
    type: String,
    enum: [
      'pending',      // Just placed
      'confirmed',    // Buyer confirmed
      'preparing',    // Buyer preparing book
      'ready',        // Ready for pickup/delivery
      'in_transit',   // For delivery orders
      'completed',    // Successfully completed
      'cancelled',    // Cancelled by either party
      'disputed'      // Issue reported
    ],
    default: 'pending'
  },
  
  // Communication and notes
  customerNotes: {
    type: String,
    maxlength: 500
  },
  buyerNotes: {
    type: String,
    maxlength: 500
  },
  
  // Timestamps for workflow
  timestamps: {
    ordered: {
      type: Date,
      default: Date.now
    },
    confirmed: Date,
    ready: Date,
    completed: Date,
    cancelled: Date
  },
  
  // Contact information at time of order
  contactInfo: {
    customerPhone: String,
    buyerPhone: String
  },
  
  // For GeoJSON export tracking
  exportedToGeoJSON: {
    type: Boolean,
    default: false
  },
  geoJSONExportDate: Date
}, {
  timestamps: true
});

// Indexes for efficient queries
orderSchema.index({ customer: 1, status: 1 });
orderSchema.index({ buyer: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ exportedToGeoJSON: 1, status: 1 });

// Pre-save middleware to populate locations from user data
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const User = mongoose.model('User');
      const [customerDoc, buyerDoc] = await Promise.all([
        User.findById(this.customer),
        User.findById(this.buyer)
      ]);
      
      if (customerDoc && buyerDoc) {
        this.locations.buyerLocation = {
          name: buyerDoc.location.name,
          coordinates: buyerDoc.location.coordinates,
          address: buyerDoc.location.address
        };
        
        if (this.orderType === 'delivery') {
          this.locations.customerLocation = {
            name: customerDoc.location.name,
            coordinates: customerDoc.location.coordinates,
            address: customerDoc.location.address
          };
        }
        
        this.contactInfo = {
          customerPhone: customerDoc.phone,
          buyerPhone: buyerDoc.phone
        };
      }
    } catch (error) {
      console.error('Error populating order locations:', error);
    }
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
