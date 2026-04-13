const express = require('express');
const router = express.Router();
const { getThreads, getThreadById, createThread, updateThread, deleteThread, searchThreads, toggleSaveThread, getSavedThreads } = require('../controllers/threadController');
const authMiddleware = require('../middleware/authMiddleware');
const optionalAuth = require('../middleware/optionalAuth');
const adminMiddleware = require('../middleware/adminMiddleware');

router.get('/', optionalAuth, getThreads);
router.get('/search', optionalAuth, searchThreads);
router.get('/saved', authMiddleware, getSavedThreads);
router.get('/:id', optionalAuth, getThreadById);
router.post('/:id/save', authMiddleware, toggleSaveThread);
router.post('/', authMiddleware, createThread);
router.put('/:id', authMiddleware, updateThread);
router.delete('/:id', authMiddleware, deleteThread);

module.exports = router;
