const Comment = require('../models/Comment');
const Thread  = require('../models/Thread');
const Vote    = require('../models/Vote');
const { updateThreadScore }        = require('../services/rankingService');
const { checkContentAgainstRules } = require('../services/moderationService');
const { CREDIBILITY_SCORES, changeUserCredibility } = require('../services/credibilityService');

// GET /api/comments/:threadId
// Returns comments as a nested tree (top-level comments with .replies arrays).
// Flagged / hidden comments are excluded for non-admin requesters.
// Soft-deleted comments are kept in the tree (with content blanked) so that
// reply threads remain coherent rather than becoming orphaned.
const getCommentsByThreadId = async (req, res, next) => {
  try {
    const query = { threadId: req.params.threadId };

    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
      query.isHidden = false;
    }

    const comments = await Comment.find(query)
      .populate('authorId', 'username role credibilityScore isSuspended')
      .sort({ score: -1, createdAt: 1 });

    // ── Batch-lookup user votes ─────────────────────────────────────────────
    let voteMap = new Map();
    if (req.user && comments.length > 0) {
      const commentIds = comments.map(c => c._id);
      const votes = await Vote.find({
        commentId: { $in: commentIds },
        userId: req.user._id
      }).lean();
      votes.forEach(v => voteMap.set(v.commentId.toString(), v.type));
    }

    // ── Build comment tree ────────────────────────────────────────────────────
    const commentMap = new Map();
    const rootComments = [];

    // First pass: index every comment and apply the deleted-content mask
    comments.forEach(c => {
      const obj = c.toObject();
      obj.replies = [];
      obj.userVote = voteMap.get(obj._id.toString()) || null;

      if (obj.isDeleted) {
        obj.content  = '[comment deleted by user]';
        obj.authorId = { username: '[deleted]', role: 'user', isDeleted: true };
        obj.mediaUrl = null;
        obj.mediaType = null;
      }

      commentMap.set(obj._id.toString(), obj);
    });

    // Second pass: nest children under their parents.
    // If a parent no longer exists (hard-deleted), promote the child to root.
    comments.forEach(c => {
      const obj = commentMap.get(c._id.toString());
      if (c.parentId) {
        const parent = commentMap.get(c.parentId.toString());
        if (parent) {
          parent.replies.push(obj);
        } else {
          rootComments.push(obj);
        }
      } else {
        rootComments.push(obj);
      }
    });

    res.status(200).json(rootComments);
  } catch (error) {
    next(error);
  }
};

// POST /api/comments
// Validates that the target thread exists and, for replies, that the parent
// comment belongs to the same thread (prevents cross-thread reply injection).
const createComment = async (req, res, next) => {
  try {
    const { threadId, content, parentId, mediaUrl, mediaType, media } = req.body;

    let normMedia = [];
    if (media && Array.isArray(media)) {
      normMedia = media;
    } else if (mediaUrl && mediaType) {
      normMedia = [{ url: mediaUrl, type: mediaType }];
    }

    const modResult = await checkContentAgainstRules(content);

    const thread = await Thread.findById(threadId);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (!parentComment) return res.status(404).json({ message: 'Parent comment not found' });
      // Guard against a client passing a parentId from a different thread
      if (parentComment.threadId.toString() !== threadId) {
        return res.status(400).json({ message: 'Parent comment does not belong to this thread' });
      }
    }

    const comment = new Comment({
      threadId,
      authorId: req.user._id,
      parentId: parentId || null,
      content,
      media:            normMedia,
      isHidden:         !modResult.isClean,
      moderationStatus: modResult.isClean ? 'approved' : 'flagged',
      systemFlagReason: modResult.isClean ? null : `Auto-flagged for keyword: ${modResult.triggeredWord}`
    });

    await comment.save();

    if (parentId) {
      await Comment.findByIdAndUpdate(parentId, { $inc: { replyCount: 1 } });
    }

    // Increment thread comment count and recompute the trending score
    thread.commentCount += 1;
    await thread.save();
    await updateThreadScore(threadId);

    await comment.populate('authorId', 'username role credibilityScore isSuspended');

    const result = comment.toObject();
    result.replies = [];

    if (!modResult.isClean) {
      await changeUserCredibility(req.user._id, CREDIBILITY_SCORES.SYSTEM_FLAGGED);
      return res.status(201).json({ ...result, isUnderReview: true });
    } else {
      await changeUserCredibility(req.user._id, CREDIBILITY_SCORES.CREATE_CONTENT);
      return res.status(201).json(result);
    }
  } catch (error) {
    next(error);
  }
};

// PUT /api/comments/:id
// Re-runs the moderation check so edited content can't bypass the keyword filter.
const updateComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.authorId.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not authorized to edit this comment' });
    }

    const modResult = await checkContentAgainstRules(content);

    comment.content          = content;
    comment.isEdited         = true;
    comment.isHidden         = !modResult.isClean;
    comment.moderationStatus = modResult.isClean ? 'approved' : 'flagged';

    await comment.save();
    res.status(200).json(comment);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/comments/:id
// Soft-deletes comments that have replies (so child context is preserved) and
// hard-deletes leaf comments (no children). Hard deletion cascades: the parent's
// replyCount is decremented and the thread's commentCount is corrected.
// Admins who delete another user's comment trigger a credibility penalty.
const deleteComment = async (req, res, next) => {
  try {
    const commentId = req.params.id;
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (!req.user ||
        (req.user.role !== 'admin' &&
         req.user.role !== 'superadmin' &&
         comment.authorId.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    const isAdminDeletion =
      (req.user.role === 'admin' || req.user.role === 'superadmin') &&
      comment.authorId.toString() !== req.user._id.toString();

    if (isAdminDeletion) {
      await changeUserCredibility(comment.authorId, CREDIBILITY_SCORES.ADMIN_DELETION);
    }

    if (comment.replyCount > 0) {
      // Soft delete — blank content but keep the document as a placeholder
      comment.isDeleted = true;
      comment.content   = '[deleted]';
      await comment.save();
    } else {
      await Comment.findByIdAndDelete(commentId);

      if (comment.parentId) {
        await Comment.findByIdAndUpdate(comment.parentId, { $inc: { replyCount: -1 } });
      }

      const thread = await Thread.findById(comment.threadId);
      if (thread) {
        thread.commentCount = Math.max(0, thread.commentCount - 1);
        await thread.save();
        await updateThreadScore(thread._id);
      }
    }

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCommentsByThreadId, createComment, updateComment, deleteComment };
