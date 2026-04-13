const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/env');

/**
 * Optional authentication middleware.
 *
 * Attempts to decode the Bearer token and attach the User to req.user, but
 * always calls next() regardless of the outcome. Used on routes that serve
 * both guests and authenticated users (e.g. thread listing, search).
 *
 * Expired or malformed tokens are silently ignored; the route handler is
 * responsible for checking whether req.user is populated if it needs it.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select('-passwordHash');
    if (user) req.user = user;

    next();
  } catch (error) {
    // Invalid / expired token — proceed as a guest
    next();
  }
};

module.exports = optionalAuth;
