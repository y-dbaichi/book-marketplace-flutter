const express = require('express');
const GeoJSONExport = require('../models/GeoJSONExport');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/generate', auth, async (req, res) => {
  try {
    const { exportType, filters = {} } = req.body;
    if (!exportType) return res.status(400).json({ message: 'exportType is required' });

    // Validate exportType
    const validTypes = ['buyer_orders', 'customer_orders', 'all_orders'];
    if (!validTypes.includes(exportType)) {
      return res.status(400).json({
        message: `Invalid exportType. Must be one of: ${validTypes.join(', ')}`
      });
    }

    const exportRecord = await GeoJSONExport.generateForUser(req.user._id, exportType, filters);
    
    res.status(201).json({
      message: 'GeoJSON export generated successfully',
      export: {
        _id: exportRecord._id,
        id: exportRecord._id,
        fileName: exportRecord.fileName,
        fileSize: exportRecord.fileSize,
        status: exportRecord.status,
        exportType: exportRecord.exportType,
        createdAt: exportRecord.createdAt,
        expiresAt: exportRecord.expiresAt,
        featureCount: exportRecord.geoJSONData.features.length
      }
    });
  } catch (error) {
    console.error('Generate GeoJSON error:', error);
    res.status(500).json({ message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

router.get('/my-exports', auth, async (req, res) => {
  try {
    const exports = await GeoJSONExport.find({ user: req.user._id, status: { $ne: 'expired' } })
      .populate('user', 'email')
      .sort({ createdAt: -1 });

    const exportsWithCount = exports.map(exp => ({
      id: exp._id,
      fileName: exp.fileName,
      fileSize: exp.fileSize,
      status: exp.status,
      exportType: exp.exportType,
      createdAt: exp.createdAt,
      expiresAt: exp.expiresAt,
      downloadCount: exp.downloadCount,
      lastDownloaded: exp.lastDownloaded,
      featureCount: exp.geoJSONData?.features?.length || 0,
      user: exp.user
    }));

    res.json({ exports: exportsWithCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/preview/:id', auth, async (req, res) => {
  try {
    const exportRecord = await GeoJSONExport.findById(req.params.id);
    if (!exportRecord) return res.status(404).json({ message: 'Export not found' });
    if (exportRecord.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (exportRecord.status === 'expired') {
      return res.status(410).json({ message: 'Export has expired' });
    }
    if (exportRecord.status === 'generating') {
      return res.status(202).json({ message: 'Export is still generating' });
    }

    // Return preview (first 10 features)
    const preview = {
      ...exportRecord.geoJSONData,
      features: exportRecord.geoJSONData.features.slice(0, 10)
    };

    res.json({
      id: exportRecord._id,
      fileName: exportRecord.fileName,
      status: exportRecord.status,
      exportType: exportRecord.exportType,
      totalFeatures: exportRecord.geoJSONData.features.length,
      preview
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid export ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/download/:id', auth, async (req, res) => {
  try {
    const exportRecord = await GeoJSONExport.findById(req.params.id);
    if (!exportRecord) return res.status(404).json({ message: 'Export not found' });
    if (exportRecord.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (exportRecord.status === 'expired') {
      return res.status(410).json({ message: 'Export has expired' });
    }
    if (exportRecord.status === 'generating') {
      return res.status(202).json({ message: 'Export is still generating' });
    }
    if (exportRecord.status !== 'ready') {
      return res.status(400).json({ message: 'Export not ready' });
    }

    exportRecord.downloadCount += 1;
    exportRecord.lastDownloaded = new Date();
    await exportRecord.save();

    res.setHeader('Content-Type', 'application/geo+json');
    res.setHeader('Content-Disposition', `attachment; filename="${exportRecord.fileName}"`);
    res.send(JSON.stringify(exportRecord.geoJSONData, null, 2));
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid export ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const exportRecord = await GeoJSONExport.findById(req.params.id);
    if (!exportRecord) {
      return res.status(404).json({ message: 'Export not found' });
    }
    if (exportRecord.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await GeoJSONExport.findByIdAndDelete(req.params.id);

    res.json({ message: 'Export deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid export ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

// Temporary debug endpoint
router.get('/debug-orders', auth, async (req, res) => {
  try {
    const Order = require('../models/Order');
    const orders = await Order.find({ seller: req.user._id })
      .populate('book')
      .limit(10);

    res.json({
      sellerId: req.user._id,
      sellerEmail: req.user.email,
      totalOrders: orders.length,
      orders: orders.map(o => ({
        id: o._id,
        book: o.book?.title,
        status: o.status,
        orderType: o.orderType,
        quantity: o.quantity,
        buyerLocation: o.buyerLocation,
        sellerLocation: o.sellerLocation
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
