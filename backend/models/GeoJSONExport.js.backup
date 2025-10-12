const mongoose = require('mongoose');

const geoJSONExportSchema = new mongoose.Schema({
  // User who requested the export
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Export type and data
  exportType: {
    type: String,
    enum: ['buyer_orders', 'customer_orders', 'delivery_routes'],
    required: true
  },
  
  // GeoJSON data structure
  geoJSONData: {
    type: {
      type: String,
      enum: ['FeatureCollection'],
      default: 'FeatureCollection'
    },
    features: [{
      type: {
        type: String,
        enum: ['Feature'],
        default: 'Feature'
      },
      geometry: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: [Number] // [longitude, latitude]
      },
      properties: {
        // Order information
        orderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Order'
        },
        bookTitle: String,
        bookAuthor: String,
        quantity: Number,
        totalPrice: Number,
        orderType: String,
        status: String,
        
        // Location information
        locationName: String,
        address: String,
        
        // Contact information
        contactName: String,
        contactPhone: String,
        
        // For mobile app integration
        pointType: {
          type: String,
          enum: ['pickup', 'delivery', 'buyer_location', 'customer_location']
        },
        
        // Additional metadata
        orderDate: Date,
        notes: String
      }
    }]
  },
  
  // Export metadata
  filters: {
    status: [String],
    orderType: [String],
    dateRange: {
      from: Date,
      to: Date
    }
  },
  
  // File information
  fileName: {
    type: String,
    required: true
  },
  fileSize: Number,
  
  // Export status
  status: {
    type: String,
    enum: ['generating', 'ready', 'expired', 'error'],
    default: 'generating'
  },
  
  // Download tracking
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloaded: Date,
  
  // Expiration (files expire after 30 days)
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
}, {
  timestamps: true
});

// Index for efficient queries
geoJSONExportSchema.index({ user: 1, createdAt: -1 });
geoJSONExportSchema.index({ status: 1, expiresAt: 1 });
geoJSONExportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to generate GeoJSON for user's orders
geoJSONExportSchema.statics.generateForUser = async function(userId, exportType, filters = {}) {
  const Order = mongoose.model('Order');
  const User = mongoose.model('User');
  
  try {
    // Build query based on export type
    let query = {};
    if (exportType === 'buyer_orders') {
      query.buyer = userId;
    } else if (exportType === 'customer_orders') {
      query.customer = userId;
    }
    
    // Apply filters
    if (filters.status && filters.status.length > 0) {
      query.status = { $in: filters.status };
    }
    if (filters.orderType && filters.orderType.length > 0) {
      query.orderType = { $in: filters.orderType };
    }
    if (filters.dateRange) {
      query.createdAt = {};
      if (filters.dateRange.from) query.createdAt.$gte = filters.dateRange.from;
      if (filters.dateRange.to) query.createdAt.$lte = filters.dateRange.to;
    }
    
    // Get orders with populated data
    const orders = await Order.find(query)
      .populate('customer', 'profile phone')
      .populate('buyer', 'profile phone')
      .populate('book', 'title author')
      .sort({ createdAt: -1 });
    
    // Generate GeoJSON features
    const features = [];
    
    for (const order of orders) {
      // Add buyer location (pickup point)
      if (order.locations.buyerLocation) {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [
              order.locations.buyerLocation.coordinates.longitude,
              order.locations.buyerLocation.coordinates.latitude
            ]
          },
          properties: {
            orderId: order._id,
            bookTitle: order.book.title,
            bookAuthor: order.book.author,
            quantity: order.quantity,
            totalPrice: order.totalPrice,
            orderType: order.orderType,
            status: order.status,
            locationName: order.locations.buyerLocation.name,
            address: order.locations.buyerLocation.address,
            contactName: `${order.buyer.profile.firstName || ''} ${order.buyer.profile.lastName || ''}`.trim(),
            contactPhone: order.contactInfo.buyerPhone,
            pointType: 'pickup',
            orderDate: order.createdAt,
            notes: order.buyerNotes || ''
          }
        });
      }
      
      // Add customer location (delivery point) if delivery order
      if (order.orderType === 'delivery' && order.locations.customerLocation) {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [
              order.locations.customerLocation.coordinates.longitude,
              order.locations.customerLocation.coordinates.latitude
            ]
          },
          properties: {
            orderId: order._id,
            bookTitle: order.book.title,
            bookAuthor: order.book.author,
            quantity: order.quantity,
            totalPrice: order.totalPrice,
            orderType: order.orderType,
            status: order.status,
            locationName: order.locations.customerLocation.name,
            address: order.locations.customerLocation.address,
            contactName: `${order.customer.profile.firstName || ''} ${order.customer.profile.lastName || ''}`.trim(),
            contactPhone: order.contactInfo.customerPhone,
            pointType: 'delivery',
            orderDate: order.createdAt,
            notes: order.customerNotes || ''
          }
        });
      }
    }
    
    // Create export record
    const fileName = `${exportType}_${userId}_${Date.now()}.geojson`;
    const geoJSONData = {
      type: 'FeatureCollection',
      features: features
    };
    
    const exportRecord = new this({
      user: userId,
      exportType: exportType,
      geoJSONData: geoJSONData,
      filters: filters,
      fileName: fileName,
      fileSize: JSON.stringify(geoJSONData).length,
      status: 'ready'
    });
    
    await exportRecord.save();
    return exportRecord;
    
  } catch (error) {
    console.error('Error generating GeoJSON export:', error);
    throw error;
  }
};

module.exports = mongoose.model('GeoJSONExport', geoJSONExportSchema);
