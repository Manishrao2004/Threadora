const express = require('express');
const router = express.Router();
const { upvote, downvote, upvoteComment, downvoteComment } = require('../controllers/voteController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/upvote', authMiddleware, upvote);
router.post('/downvote', authMiddleware, downvote);
router.post('/comment/upvote', authMiddleware, upvoteComment);
router.post('/comment/downvote', authMiddleware, downvoteComment);

module.exports = router;
