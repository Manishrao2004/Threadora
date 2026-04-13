// Exclusive to superadmin accounts — used for destructive or privileged admin actions
// such as role assignment, user deletion, and system config changes.
const superAdminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    return next();
  }
  res.status(403).json({ message: 'Superadmin access required' });
};

module.exports = superAdminMiddleware;
