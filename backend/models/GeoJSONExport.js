const mongoose = require('mongoose');

const geoJSONExportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exportType: {
    type: String,
    enum: ['buyer_orders', 'customer_orders', 'all_orders'],
    required: true
  },
  fileName: String,
  geoJSONData: Object,
  fileSize: Number,
  status: {
    type: String,
    enum: ['generating', 'ready', 'expired', 'error'],
    default: 'generating'
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloaded: Date,
  expiresAt: Date,
  filters: Object
}, {
  timestamps: true
});

geoJSONExportSchema.statics.generateForUser = async function(userId, exportType, filters = {}) {
  const Order = mongoose.model('Order');

  let query = {};

  // Query based on export type
  if (exportType === 'buyer_orders') {
    query.buyer = userId;
  } else if (exportType === 'customer_orders') {
    query.buyer = userId;
  } else if (exportType === 'all_orders') {
    query.$or = [{ buyer: userId }, { seller: userId }];
  }

  // Only export confirmed orders
  query.status = 'confirmed';

  // Apply additional filters if provided
  if (filters.dateFrom) {
    query.createdAt = { ...query.createdAt, $gte: new Date(filters.dateFrom) };
  }
  if (filters.dateTo) {
    query.createdAt = { ...query.createdAt, $lte: new Date(filters.dateTo) };
  }

  const orders = await Order.find(query)
    .populate('book', 'title author price category')
    .populate('buyer', 'profile phone')
    .populate('seller', 'profile phone')
    .sort({ createdAt: -1 })
    .lean();

  const features = orders
    .filter(o => o.buyerLocation && o.buyerLocation.coordinates && o.buyerLocation.coordinates.length === 2)
    .map(order => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: order.buyerLocation.coordinates
      },
      properties: {
        orderId: order._id.toString(),
        bookTitle: order.book?.title || 'Unknown',
        bookAuthor: order.book?.author || 'Unknown',
        bookCategory: order.book?.category || 'Unknown',
        quantity: order.quantity,
        totalPrice: order.totalPrice,
        status: order.status,
        locationName: order.buyerLocation.name || 'Delivery Point',
        address: order.buyerLocation.address || '',
        buyerName: order.buyer?.profile ? `${order.buyer.profile.firstName || ''} ${order.buyer.profile.lastName || ''}`.trim() : 'Customer',
        buyerPhone: order.buyer?.phone || '',
        sellerName: order.seller?.profile ? `${order.seller.profile.firstName || ''} ${order.seller.profile.lastName || ''}`.trim() : 'Seller',
        sellerPhone: order.seller?.phone || '',
        orderDate: order.createdAt,
        notes: order.buyerNotes || ''
      }
    }));

  const geoJSONData = {
    type: 'FeatureCollection',
    features: features,
    properties: {
      exportType,
      generatedAt: new Date().toISOString(),
      totalFeatures: features.length
    }
  };

  const fileName = `${exportType}_${userId}_${Date.now()}.geojson`;

  const exportRecord = await this.create({
    user: userId,
    exportType,
    fileName,
    geoJSONData,
    fileSize: JSON.stringify(geoJSONData).length,
    status: 'ready',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    filters
  });

  console.log(`✅ Created ${exportType} export with ${features.length} features for user ${userId}`);
  return exportRecord;
};

module.exports = mongoose.model('GeoJSONExport', geoJSONExportSchema);
