const SystemConfig = require('../models/SystemConfig');

// GET /api/admin/config  (SuperAdmin only)
// Seeds a default config document on first run so the app works without a
// manual DB setup step. The default blocked-keyword list covers common spam
// patterns and hate speech; it can be fully replaced from the admin panel.
const getConfig = async (req, res, next) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = await SystemConfig.create({
        blockedKeywords: [
          'spam', 'scam', 'free money', 'click here', 'viagra', 'porn', 'xxx',
          'earn money fast', 'crypto giveaway', 'fuck', 'shit', 'bitch',
          'asshole', 'cunt', 'nigger', 'faggot', 'kill yourself'
        ]
      });
    }
    res.status(200).json(config);
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/config  (SuperAdmin only)
// Only the fields explicitly included in the request body are updated;
// omitted fields remain unchanged (partial update pattern).
const updateConfig = async (req, res, next) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) config = new SystemConfig();

    if (req.body.maintenanceMode          !== undefined) config.maintenanceMode          = req.body.maintenanceMode;
    if (req.body.allowGuestViews          !== undefined) config.allowGuestViews          = req.body.allowGuestViews;
    if (req.body.requireEmailVerification !== undefined) config.requireEmailVerification = req.body.requireEmailVerification;
    if (req.body.blockedKeywords          !== undefined) config.blockedKeywords          = req.body.blockedKeywords;

    await config.save();
    res.status(200).json(config);
  } catch (error) {
    next(error);
  }
};

module.exports = { getConfig, updateConfig };
