const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  googleLogin,
  updateProfile,
  changePassword,
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);

// Protected routes
router.get('/me', authMiddleware, getMe);
router.put('/me', authMiddleware, updateProfile);
router.put('/password', authMiddleware, changePassword);

module.exports = router;
