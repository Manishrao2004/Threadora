// Allows both 'admin' and 'superadmin' roles — superadmins inherit all admin permissions.
const adminMiddleware = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
    return next();
  }
  res.status(403).json({ message: 'Admin access required' });
};

module.exports = adminMiddleware;
