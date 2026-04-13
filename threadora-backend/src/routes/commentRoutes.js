const express = require('express');
const router = express.Router();
const { getCommentsByThreadId, createComment, updateComment, deleteComment } = require('../controllers/commentController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/:threadId', getCommentsByThreadId);
router.post('/', authMiddleware, createComment);
router.put('/:id', authMiddleware, updateComment);
router.delete('/:id', authMiddleware, deleteComment);

module.exports = router;
