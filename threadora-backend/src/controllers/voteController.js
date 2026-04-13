const Vote    = require('../models/Vote');
const Thread  = require('../models/Thread');
const Comment = require('../models/Comment');
const { updateThreadScore } = require('../services/rankingService');
const { CREDIBILITY_SCORES, changeUserCredibility } = require('../services/credibilityService');

// ─── Thread Voting ────────────────────────────────────────────────────────────
//
// handleVote implements three-state voting (toggle off / switch / new):
//   - Same vote again  → undo (remove the record, reverse credibility delta)
//   - Different type   → flip (swap the type, reverse old delta + apply new)
//   - No existing vote → register a new vote
//
// Vote counts are stored denormalised on Thread for fast sorting; the Vote
// collection is the source of truth for "did this user vote?" lookups.

const handleVote = async (req, res, next, type) => {
  try {
    const { threadId } = req.body;
    const userId = req.user._id;

    const thread = await Thread.findById(threadId);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    // Query scoped to commentId: null so partial indexes don't cause
    // false matches against comment votes for the same (userId, threadId) pair
    const existingVote = await Vote.findOne({ threadId, userId, commentId: null });

    if (existingVote) {
      if (existingVote.type === type) {
        // Undo: remove vote and reverse the credibility adjustment
        await Vote.deleteOne({ _id: existingVote._id });
        if (type === 'upvote')   thread.upvotes   = Math.max(0, thread.upvotes   - 1);
        else                     thread.downvotes  = Math.max(0, thread.downvotes - 1);

        await thread.save();
        await updateThreadScore(threadId);
        await changeUserCredibility(
          thread.authorId,
          type === 'upvote' ? -CREDIBILITY_SCORES.RECEIVE_UPVOTE : -CREDIBILITY_SCORES.RECEIVE_DOWNVOTE
        );

        return res.status(200).json({
          message: `${type} removed`,
          upvotes:   thread.upvotes,
          downvotes: thread.downvotes
        });
      } else {
        // Flip: reverse old credibility delta, apply new one
        const oldType = existingVote.type;
        existingVote.type = type;
        await existingVote.save();

        if (type === 'upvote') {
          thread.upvotes   += 1;
          thread.downvotes  = Math.max(0, thread.downvotes - 1);
        } else {
          thread.downvotes += 1;
          thread.upvotes    = Math.max(0, thread.upvotes - 1);
        }

        await thread.save();
        await updateThreadScore(threadId);
        await changeUserCredibility(
          thread.authorId,
          oldType === 'upvote' ? -CREDIBILITY_SCORES.RECEIVE_UPVOTE : -CREDIBILITY_SCORES.RECEIVE_DOWNVOTE
        );
        await changeUserCredibility(
          thread.authorId,
          type === 'upvote' ? CREDIBILITY_SCORES.RECEIVE_UPVOTE : CREDIBILITY_SCORES.RECEIVE_DOWNVOTE
        );

        return res.status(200).json({
          message:   `Changed to ${type}`,
          upvotes:   thread.upvotes,
          downvotes: thread.downvotes
        });
      }
    }

    // New vote
    const vote = new Vote({ threadId, userId, type });
    await vote.save();

    if (type === 'upvote') thread.upvotes   += 1;
    else                   thread.downvotes += 1;

    await thread.save();
    await updateThreadScore(threadId);
    await changeUserCredibility(
      thread.authorId,
      type === 'upvote' ? CREDIBILITY_SCORES.RECEIVE_UPVOTE : CREDIBILITY_SCORES.RECEIVE_DOWNVOTE
    );

    res.status(200).json({
      message:   `${type} registered`,
      upvotes:   thread.upvotes,
      downvotes: thread.downvotes
    });
  } catch (error) {
    next(error);
  }
};

const upvote   = (req, res, next) => handleVote(req, res, next, 'upvote');
const downvote = (req, res, next) => handleVote(req, res, next, 'downvote');

// ─── Comment Voting ───────────────────────────────────────────────────────────
// Same three-state pattern as thread voting; comment score is kept in sync
// directly on the Comment document (no separate ranking service for comments).

const handleCommentVote = async (req, res, next, type) => {
  try {
    const { commentId } = req.body;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const existingVote = await Vote.findOne({ commentId, userId });

    if (existingVote) {
      if (existingVote.type === type) {
        // Undo
        await Vote.deleteOne({ _id: existingVote._id });
        if (type === 'upvote')  comment.upvotes   = Math.max(0, (comment.upvotes  || 0) - 1);
        else                    comment.downvotes  = Math.max(0, (comment.downvotes || 0) - 1);

        comment.score = comment.upvotes - comment.downvotes;
        await comment.save();
        await changeUserCredibility(
          comment.authorId,
          type === 'upvote' ? -CREDIBILITY_SCORES.RECEIVE_UPVOTE : -CREDIBILITY_SCORES.RECEIVE_DOWNVOTE
        );

        return res.status(200).json({
          message:   `${type} removed`,
          score:     comment.score,
          commentId: comment._id,
          userVote:  null
        });
      } else {
        // Flip
        const oldType = existingVote.type;
        existingVote.type = type;
        await existingVote.save();

        if (type === 'upvote') {
          comment.upvotes   += 1;
          comment.downvotes  = Math.max(0, (comment.downvotes || 0) - 1);
        } else {
          comment.downvotes += 1;
          comment.upvotes    = Math.max(0, (comment.upvotes || 0) - 1);
        }

        comment.score = comment.upvotes - comment.downvotes;
        await comment.save();
        await changeUserCredibility(
          comment.authorId,
          oldType === 'upvote' ? -CREDIBILITY_SCORES.RECEIVE_UPVOTE : -CREDIBILITY_SCORES.RECEIVE_DOWNVOTE
        );
        await changeUserCredibility(
          comment.authorId,
          type === 'upvote' ? CREDIBILITY_SCORES.RECEIVE_UPVOTE : CREDIBILITY_SCORES.RECEIVE_DOWNVOTE
        );

        return res.status(200).json({
          message:   `Changed to ${type}`,
          score:     comment.score,
          commentId: comment._id,
          userVote:  type
        });
      }
    }

    // New vote
    const vote = new Vote({ commentId, userId, type });
    await vote.save();

    if (type === 'upvote') comment.upvotes   += 1;
    else                   comment.downvotes += 1;

    comment.score = comment.upvotes - comment.downvotes;
    await comment.save();
    await changeUserCredibility(
      comment.authorId,
      type === 'upvote' ? CREDIBILITY_SCORES.RECEIVE_UPVOTE : CREDIBILITY_SCORES.RECEIVE_DOWNVOTE
    );

    res.status(200).json({
      message:   `${type} registered`,
      score:     comment.score,
      commentId: comment._id,
      userVote:  type
    });
  } catch (error) {
    next(error);
  }
};

const upvoteComment   = (req, res, next) => handleCommentVote(req, res, next, 'upvote');
const downvoteComment = (req, res, next) => handleCommentVote(req, res, next, 'downvote');

module.exports = { upvote, downvote, upvoteComment, downvoteComment };
