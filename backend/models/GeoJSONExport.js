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
  if (exportType === 'buyer_orders') {
    query['buyer.user'] = userId;
  }
  
  query.status = 'confirmed';
  
  const orders = await Order.find(query)
    .populate('book', 'title author price')
    .populate('customer', 'profile phone')
    .sort({ createdAt: -1 })
    .lean();
  
  const features = orders
    .filter(o => o.customerLocation && o.customerLocation.coordinates)
    .map(order => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: order.customerLocation.coordinates
      },
      properties: {
        orderId: order._id.toString(),
        bookTitle: order.book?.title || 'Unknown',
        bookAuthor: order.book?.author || 'Unknown',
        quantity: order.quantity,
        totalPrice: order.totalPrice,
        status: order.status,
        locationName: order.customerLocation.name || 'Delivery Point',
        address: order.customerLocation.address || '',
        contactName: order.customer?.name || 'Customer',
        contactPhone: order.customer?.phone || '',
        orderDate: order.createdAt,
        notes: order.customerNotes || ''
      }
    }));
  
  const geoJSONData = {
    type: 'FeatureCollection',
    features: features
  };
  
  const fileName = `buyer_orders_${userId}_${Date.now()}.geojson`;
  
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
  
  console.log(`✅ Created export with ${features.length} features`);
  return exportRecord;
};

module.exports = mongoose.model('GeoJSONExport', geoJSONExportSchema);
