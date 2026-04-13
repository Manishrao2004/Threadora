const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  maintenanceMode: { type: Boolean, default: false },
  allowGuestViews: { type: Boolean, default: true },
  requireEmailVerification: { type: Boolean, default: false },
  blockedKeywords: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
