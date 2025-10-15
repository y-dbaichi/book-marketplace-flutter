const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  author: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  quality: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    maxlength: 1000,
    trim: true
  },
  category: {
    type: String,
    trim: true,
    maxlength: 50
  },
  isbn: {
    type: String,
    trim: true
  },
  // Reference to the seller (book owner)
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Availability status
  status: {
    type: String,
    enum: ['available', 'reserved', 'sold', 'inactive'],
    default: 'available'
  },
  // Images (optional for now)
  images: [{
    url: String,
    alt: String
  }],
  // Book condition details
  condition: {
    hasWriting: {
      type: Boolean,
      default: false
    },
    hasHighlighting: {
      type: Boolean,
      default: false
    },
    hasDamage: {
      type: Boolean,
      default: false
    },
    damageDescription: {
      type: String,
      maxlength: 200
    }
  },
  // Metrics
  views: {
    type: Number,
    default: 0
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Index for search functionality
bookSchema.index({ title: 'text', author: 'text', category: 'text' });
bookSchema.index({ seller: 1, status: 1 });
bookSchema.index({ status: 1, createdAt: -1 });

// Virtual for available quantity (considering reserved orders)
bookSchema.virtual('availableQuantity').get(function() {
  // This would need to be calculated based on pending orders
  return this.quantity;
});

module.exports = mongoose.model('Book', bookSchema);
