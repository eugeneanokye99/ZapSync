const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  // Core metrics (no ActivityLog dependency)
  totalUsers: { type: Number, default: 0 },
  activeUsers: { type: Number, default: 0 },
  totalFiles: { type: Number, default: 0 },
  storageUsed: { type: Number, default: 0 }, // in MB
  uploadsToday: { type: Number, default: 0 },
  downloadsToday: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });


module.exports = mongoose.model('Analytics', analyticsSchema);