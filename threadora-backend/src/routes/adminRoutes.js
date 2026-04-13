const express = require('express');
const router = express.Router();
const { getSystemStats, getUsers, updateUserRole, deleteUser, toggleUserSuspension, getModerationQueue, approveModerationItem } = require('../controllers/adminController');
const { getConfig, updateConfig } = require('../controllers/configController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const superAdminMiddleware = require('../middleware/superAdminMiddleware');

// Base authentication for all routes
router.use(authMiddleware);

// --- Admin & SuperAdmin Shared Access ---
router.get('/stats', adminMiddleware, getSystemStats);
router.get('/users', adminMiddleware, getUsers);
router.put('/users/:id/suspend', adminMiddleware, toggleUserSuspension);
router.get('/moderation-queue', adminMiddleware, getModerationQueue);
router.put('/moderation-queue/:id/approve', adminMiddleware, approveModerationItem);

// --- SuperAdmin Exclusive Access ---
router.put('/users/:id/role', superAdminMiddleware, updateUserRole);
router.delete('/users/:id', superAdminMiddleware, deleteUser);
router.get('/config', superAdminMiddleware, getConfig);
router.put('/config', superAdminMiddleware, updateConfig);

module.exports = router;
