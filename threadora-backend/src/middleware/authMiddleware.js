const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/env');

/**
 * Enforces authentication for protected routes.
 *
 * Suspended users can still make GET requests (read content) but are blocked
 * from any write operation. This lets them see the community while preventing
 * them from posting, voting, or making changes.
 *
 * Attaches the full User document (minus passwordHash) to req.user.
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.isSuspended && req.method !== 'GET') {
      return res.status(403).json({
        message: 'Your account is currently suspended from performing this action.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authMiddleware;
