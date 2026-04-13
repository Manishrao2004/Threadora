const jwt          = require('jsonwebtoken');
const User         = require('../models/User');
const SystemConfig = require('../models/SystemConfig');
const { JWT_SECRET } = require('../config/env');

/**
 * System-level gate applied to every /api route before any route-specific
 * middleware runs.
 *
 * Responsibilities:
 *   1. Maintenance mode — returns 503 for all non-admin, non-auth requests.
 *      Auth routes (/auth/*) stay open so admins can sign in even while the
 *      site is down.
 *   2. Guest access — when allowGuestViews is disabled, unauthenticated
 *      requests to public content routes (threads, comments, categories)
 *      are rejected with 401.
 *
 * The token is decoded here only to check the user's role for the above two
 * gates; full authentication (including token expiry and user state checks)
 * is still enforced by authMiddleware on protected endpoints.
 */
const systemMiddleware = async (req, res, next) => {
  try {
    const config = await SystemConfig.findOne();
    if (!config) return next(); // No config document yet — nothing to enforce

    let user = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      try {
        const token   = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        user = await User.findById(decoded.id);
      } catch {
        // Invalid token — treat as unauthenticated for the purpose of these checks
      }
    }

    if (config.maintenanceMode) {
      const isAuthRoute = req.path.startsWith('/auth');
      const isAdmin     = user && (user.role === 'admin' || user.role === 'superadmin');

      if (!isAuthRoute && !isAdmin) {
        return res.status(503).json({ message: 'System is down for scheduled maintenance.' });
      }
    }

    if (!config.allowGuestViews && !user) {
      const isPublicContent =
        req.path.startsWith('/threads') ||
        req.path.startsWith('/comments') ||
        req.path.startsWith('/categories');

      if (isPublicContent) {
        return res.status(401).json({ message: 'Guest access is restricted. Please log in to continue.' });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = systemMiddleware;
