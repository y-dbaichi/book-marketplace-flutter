const express = require('express');
const GeoJSONExport = require('../models/GeoJSONExport');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/geojson/generate
// @desc    Generate GeoJSON export for user's orders
// @access  Private
router.post('/generate', auth, async (req, res) => {
  try {
    const { exportType, filters = {} } = req.body;

    // Validation
    if (!exportType) {
      return res.status(400).json({ message: 'exportType is required' });
    }

    const validExportTypes = ['buyer_orders', 'customer_orders', 'delivery_routes'];
    if (!validExportTypes.includes(exportType)) {
      return res.status(400).json({
        message: `exportType must be one of: ${validExportTypes.join(', ')}`
      });
    }

    // Validate user type for export type
    if (exportType === 'buyer_orders' && req.user.userType !== 'buyer') {
      return res.status(403).json({
        message: 'Only buyers can export buyer orders'
      });
    }

    if (exportType === 'customer_orders' && req.user.userType !== 'customer') {
      return res.status(403).json({
        message: 'Only customers can export customer orders'
      });
    }

    // Process filters
    const processedFilters = {};

    if (filters.status && Array.isArray(filters.status)) {
      processedFilters.status = filters.status;
    }

    if (filters.orderType && Array.isArray(filters.orderType)) {
      processedFilters.orderType = filters.orderType;
    }

    if (filters.dateRange) {
      processedFilters.dateRange = {};
      if (filters.dateRange.from) {
        processedFilters.dateRange.from = new Date(filters.dateRange.from);
      }
      if (filters.dateRange.to) {
        processedFilters.dateRange.to = new Date(filters.dateRange.to);
      }
    }

    console.log('🗺️  Generating GeoJSON export...');
    console.log('   User:', req.user._id);
    console.log('   Type:', exportType);
    console.log('   Filters:', JSON.stringify(processedFilters));

    // Generate GeoJSON export
    const exportRecord = await GeoJSONExport.generateForUser(
      req.user._id,
      exportType,
      processedFilters
    );

    console.log('✅ GeoJSON export generated successfully');
    console.log('   Features:', exportRecord.geoJSONData.features.length);

    res.status(201).json({
      message: 'GeoJSON export generated successfully',
      export: {
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
    console.error('❌ Generate GeoJSON error:', error);
    res.status(500).json({
      message: 'Server error generating GeoJSON export',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/geojson/my-exports
// @desc    Get user's GeoJSON exports
// @access  Private
router.get('/my-exports', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // ✅ FIXED: Include geoJSONData to get feature count, then remove it
    const exports = await GeoJSONExport.find({
      user: req.user._id,
      status: { $ne: 'expired' }
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await GeoJSONExport.countDocuments({
      user: req.user._id,
      status: { $ne: 'expired' }
    });

    // ✅ FIXED: Now including featureCount from geoJSONData
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
      featureCount: exp.geoJSONData?.features?.length || 0  // ✅ ADDED THIS!
    }));

    console.log(`📋 Retrieved ${exports.length} exports for user ${req.user._id}`);

    res.json({
      exports: exportsWithCount,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: skip + exports.length < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('❌ Get exports error:', error);
    res.status(500).json({
      message: 'Server error getting exports',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/geojson/download/:id
// @desc    Download GeoJSON export file
// @access  Private
router.get('/download/:id', auth, async (req, res) => {
  try {
    console.log(`📥 Download request for export ${req.params.id} from user ${req.user._id}`);

    const exportRecord = await GeoJSONExport.findById(req.params.id);

    if (!exportRecord) {
      console.log('❌ Export not found');
      return res.status(404).json({ message: 'Export not found' });
    }

    // Check ownership
    if (exportRecord.user.toString() !== req.user._id.toString()) {
      console.log('❌ Unauthorized download attempt');
      return res.status(403).json({ message: 'Not authorized to download this export' });
    }

    // Check if export is ready
    if (exportRecord.status !== 'ready') {
      console.log(`❌ Export not ready. Current status: ${exportRecord.status}`);
      return res.status(400).json({
        message: `Export is not ready. Current status: ${exportRecord.status}`
      });
    }

    // Check if expired
    if (exportRecord.expiresAt < new Date()) {
      console.log('❌ Export has expired');
      exportRecord.status = 'expired';
      await exportRecord.save();
      return res.status(410).json({ message: 'Export has expired' });
    }

    // Update download tracking
    exportRecord.downloadCount += 1;
    exportRecord.lastDownloaded = new Date();
    await exportRecord.save();

    console.log(`✅ Sending GeoJSON file: ${exportRecord.fileName}`);
    console.log(`   Features: ${exportRecord.geoJSONData.features.length}`);
    console.log(`   File size: ${exportRecord.fileSize} bytes`);

    // Set headers for file download
    res.setHeader('Content-Type', 'application/geo+json');
    res.setHeader('Content-Disposition', `attachment; filename="${exportRecord.fileName}"`);
    res.setHeader('Content-Length', exportRecord.fileSize);

    // Send the GeoJSON data
    res.attachment(exportRecord.fileName);
    res.send(JSON.stringify(exportRecord.geoJSONData, null, 2)); // Pretty print

  } catch (error) {
    console.error('❌ Download export error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Export not found' });
    }
    res.status(500).json({
      message: 'Server error downloading export',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/geojson/:id
// @desc    Delete GeoJSON export
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const exportRecord = await GeoJSONExport.findById(req.params.id);

    if (!exportRecord) {
      return res.status(404).json({ message: 'Export not found' });
    }

    // Check ownership
    if (exportRecord.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this export' });
    }

    await GeoJSONExport.findByIdAndDelete(req.params.id);

    console.log(`🗑️  Export ${req.params.id} deleted successfully`);

    res.json({ message: 'Export deleted successfully' });

  } catch (error) {
    console.error('❌ Delete export error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Export not found' });
    }
    res.status(500).json({
      message: 'Server error deleting export',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/geojson/preview/:id
// @desc    Preview GeoJSON export (first 10 features)
// @access  Private
router.get('/preview/:id', auth, async (req, res) => {
  try {
    const exportRecord = await GeoJSONExport.findById(req.params.id);

    if (!exportRecord) {
      return res.status(404).json({ message: 'Export not found' });
    }

    // Check ownership
    if (exportRecord.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to preview this export' });
    }

    // Check if export is ready
    if (exportRecord.status !== 'ready') {
      return res.status(400).json({
        message: `Export is not ready. Current status: ${exportRecord.status}`
      });
    }

    // Return preview with first 10 features
    const preview = {
      type: 'FeatureCollection',
      features: exportRecord.geoJSONData.features.slice(0, 10)
    };

    console.log(`👁️  Preview generated for export ${req.params.id}`);
    console.log(`   Total features: ${exportRecord.geoJSONData.features.length}`);
    console.log(`   Preview features: ${preview.features.length}`);

    res.json({
      preview: preview,
      totalFeatures: exportRecord.geoJSONData.features.length,
      previewFeatures: preview.features.length
    });

  } catch (error) {
    console.error('❌ Preview export error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Export not found' });
    }
    res.status(500).json({
      message: 'Server error previewing export',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;