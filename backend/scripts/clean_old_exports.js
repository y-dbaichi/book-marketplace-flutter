require('dotenv').config();
const mongoose = require('mongoose');
const GeoJSONExport = require('../models/GeoJSONExport');

async function cleanOldExports() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const result = await GeoJSONExport.deleteMany({});
    console.log('Deleted', result.deletedCount, 'old exports');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanOldExports();
