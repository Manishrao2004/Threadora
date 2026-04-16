const Thread  = require('../models/Thread');
const Comment = require('../models/Comment');
const Vote    = require('../models/Vote');
const Report  = require('../models/Report');
const { updateThreadScore }        = require('../services/rankingService');
const { checkDuplicates }          = require('../services/duplicateDetectionService');
const { checkContentAgainstRules } = require('../services/moderationService');
const { CREDIBILITY_SCORES, changeUserCredibility } = require('../services/credibilityService');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Given an array of thread documents (plain objects) and an authenticated user,
 * batch-queries the Vote collection and attaches a `userVote` field to each
 * thread ('upvote' | 'downvote' | null).
 *
 * No-ops gracefully when there is no authenticated user.
 */
const attachUserVotes = async (threads, user) => {
  if (!user || threads.length === 0) return threads;

  const threadIds = threads.map(t => t._id);
  const votes = await Vote.find({
    threadId: { $in: threadIds },
    userId: user._id,
    commentId: null
  }).lean();

  const voteMap = new Map();
  votes.forEach(v => voteMap.set(v.threadId.toString(), v.type));

  return threads.map(t => ({
    ...t,
    userVote: voteMap.get(t._id.toString()) || null
  }));
};

// GET /api/threads
// Supports pagination, category/author filters, and three sort orders:
//   trending (default) — by precomputed score
//   new               — by creation date
//   top               — by raw upvote count
// Hidden threads are excluded unless the requester is the author or an admin.
const getThreads = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { categoryId, authorId, sort_by: sortBy = 'trending' } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    const isOwner = authorId && req.user && authorId === req.user._id?.toString();
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'superadmin');

    if (!isOwner && !isAdmin) {
      query.isHidden = false;
    }

    if (categoryId) query.categoryId = categoryId;
    if (authorId)   query.authorId   = authorId;

    let sortOptions = { score: -1, createdAt: -1 };
    if (sortBy === 'new') sortOptions = { createdAt: -1 };
    if (sortBy === 'top') sortOptions = { upvotes: -1, createdAt: -1 };

    const threads = await Thread.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('authorId',   'username role credibilityScore isSuspended')
      .populate('categoryId', 'name')
      .lean();

    const total = await Thread.countDocuments(query);

    const threadsWithVotes = await attachUserVotes(threads, req.user);

    res.status(200).json({
      threads: threadsWithVotes,
      total,
      totalPages:  Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/threads/:id
// Returns 404 for both legitimately missing threads and hidden threads that the
// requester has no right to see — avoids leaking info about hidden content.
const getThreadById = async (req, res, next) => {
  try {
    const thread = await Thread.findById(req.params.id)
      .populate('authorId',   'username role credibilityScore isSuspended')
      .populate('categoryId', 'name')
      .lean();

    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    const isAuthor = req.user && thread.authorId?._id?.toString() === req.user._id?.toString();
    const isAdmin  = req.user && (req.user.role === 'admin' || req.user.role === 'superadmin');
    if (thread.isHidden && !isAuthor && !isAdmin) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    // Attach userVote for the logged-in user
    if (req.user) {
      const vote = await Vote.findOne({
        threadId: thread._id,
        userId: req.user._id,
        commentId: null
      }).lean();
      thread.userVote = vote ? vote.type : null;
    } else {
      thread.userVote = null;
    }

    res.status(200).json(thread);
  } catch (error) {
    next(error);
  }
};

// POST /api/threads
// Runs both the content moderation check and a duplicate-title check before saving.
// Auto-flagged threads are saved but hidden; the author's credibility is penalised.
const createThread = async (req, res, next) => {
  try {
    const { title, content, categoryId, mediaUrl, mediaType, media } = req.body;

    // Accept either the legacy single-media fields or the newer array format
    let normMedia = [];
    if (media && Array.isArray(media)) {
      normMedia = media;
    } else if (mediaUrl && mediaType) {
      normMedia = [{ url: mediaUrl, type: mediaType }];
    }

    const modResult = await checkContentAgainstRules(title, content);

    // Skip the duplicate check when the content is already being flagged —
    // the post is hidden anyway, so surfacing duplicates adds no value.
    const duplicates = await checkDuplicates(title);
    if (duplicates.length > 0 && !req.body.ignoreDuplicates && modResult.isClean) {
      return res.status(409).json({
        message: 'Possible duplicate threads found',
        suggestedThreads: duplicates
      });
    }

    const thread = new Thread({
      title,
      content,
      categoryId,
      authorId: req.user._id,
      media:    normMedia,
      isHidden:         !modResult.isClean,
      moderationStatus: modResult.isClean ? 'approved' : 'flagged',
      systemFlagReason: modResult.isClean ? null : `Auto-flagged for keyword: ${modResult.triggeredWord}`
    });

    await thread.save();

    if (!modResult.isClean) {
      await changeUserCredibility(req.user._id, CREDIBILITY_SCORES.SYSTEM_FLAGGED);
      return res.status(201).json({ ...thread.toObject(), isUnderReview: true });
    } else {
      await changeUserCredibility(req.user._id, CREDIBILITY_SCORES.CREATE_CONTENT);
      return res.status(201).json(thread);
    }
  } catch (error) {
    next(error);
  }
};

// PUT /api/threads/:id
// Re-runs the moderation check on the new content so edits can't sneak
// blocked keywords past the filter.
const updateThread = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, categoryId, media } = req.body;

    const thread = await Thread.findById(id);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    if (thread.authorId.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not authorized to edit this thread' });
    }

    // Check the merged content — fall back to stored values for any field not in the request
    const modResult = await checkContentAgainstRules(
      title   || thread.title,
      content || thread.content
    );

    thread.title   = title   || thread.title;
    thread.content = content || thread.content;
    if (categoryId)        thread.categoryId = categoryId;
    if (media !== undefined) thread.media    = media;
    thread.isEdited          = true;
    thread.isHidden          = !modResult.isClean;
    thread.moderationStatus  = modResult.isClean ? 'approved' : 'flagged';

    await thread.save();
    res.status(200).json(thread);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/threads/:id
// Cascade-deletes all associated comments, votes, and reports in parallel
// via Promise.all so we never leave orphaned documents behind.
// Admins who delete another user's thread trigger a credibility penalty on that user.
const deleteThread = async (req, res, next) => {
  try {
    const threadId = req.params.id;
    const thread = await Thread.findById(threadId);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    if (thread.authorId.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not authorized to delete this thread' });
    }

    const isAdminDeletion =
      (req.user.role === 'admin' || req.user.role === 'superadmin') &&
      thread.authorId.toString() !== req.user._id.toString();

    if (isAdminDeletion) {
      await changeUserCredibility(thread.authorId, CREDIBILITY_SCORES.ADMIN_DELETION);
    }

    await Promise.all([
      Comment.deleteMany({ threadId }),
      Vote.deleteMany({ threadId }),
      Report.deleteMany({ threadId }),
      Thread.deleteOne({ _id: threadId })
    ]);

    res.status(200).json({ message: 'Thread deleted successfully with all associated content' });
  } catch (error) {
    next(error);
  }
};

// GET /api/threads/search?q=...
// Falls back to a regex search rather than the MongoDB text index so that
// partial-word matches work (e.g. "react" matches "reactivity").
// Hidden threads are excluded unless the requested authorId matches the requester.
const searchThreads = async (req, res, next) => {
  try {
    const { q, categoryId, authorId, page: p = 1, limit: l = 10 } = req.query;
    const page  = parseInt(p);
    const limit = parseInt(l);
    const skip  = (page - 1) * limit;

    if (!q || !q.trim()) {
      return res.status(200).json({ threads: [], totalPages: 0, currentPage: 1 });
    }

    const queryStr = q.trim();
    const isOwner  = authorId && req.user && authorId === req.user._id?.toString();
    const isAdmin  = req.user && (req.user.role === 'admin' || req.user.role === 'superadmin');

    const baseQuery = {};
    if (!isOwner && !isAdmin) baseQuery.isHidden = false;

    // Sanitise 'null' / 'undefined' string values that can arrive from the frontend
    if (categoryId && categoryId !== 'null' && categoryId !== 'undefined') {
      baseQuery.categoryId = categoryId;
    }
    if (authorId && authorId !== 'null' && authorId !== 'undefined') {
      baseQuery.authorId = authorId;
    }

    // Escape regex special characters so user input doesn't break the query
    const escapedQ = queryStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const query = {
      ...baseQuery,
      $or: [
        { title:   { $regex: escapedQ, $options: 'i' } },
        { content: { $regex: escapedQ, $options: 'i' } }
      ]
    };

    const [threads, total] = await Promise.all([
      Thread.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('authorId',   'username role credibilityScore isSuspended')
        .populate('categoryId', 'name')
        .lean(),
      Thread.countDocuments(query)
    ]);

    const threadsWithVotes = await attachUserVotes(threads, req.user);

    res.status(200).json({
      threads: threadsWithVotes,
      totalPages:  Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/threads/:id/save — toggles the saved state for the authenticated user
const toggleSaveThread = async (req, res, next) => {
  try {
    const threadId = req.params.id;
    const user = req.user;

    const index = user.savedThreads.indexOf(threadId);
    let saved = false;
    if (index === -1) {
      user.savedThreads.push(threadId);
      saved = true;
    } else {
      user.savedThreads.splice(index, 1);
    }

    await user.save();
    res.status(200).json({ saved, savedThreads: user.savedThreads });
  } catch (error) {
    next(error);
  }
};

// GET /api/threads/saved — paginated list of the authenticated user's saved threads
const getSavedThreads = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;
    const { categoryId } = req.query;

    const query = { _id: { $in: req.user.savedThreads } };
    if (categoryId && categoryId !== 'null' && categoryId !== 'undefined' && categoryId !== '') {
      query.categoryId = categoryId;
    }

    const [threads, total] = await Promise.all([
      Thread.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('authorId',   'username role credibilityScore isSuspended')
        .populate('categoryId', 'name')
        .lean(),
      Thread.countDocuments(query)
    ]);

    const threadsWithVotes = await attachUserVotes(threads, req.user);

    res.status(200).json({
      threads: threadsWithVotes,
      totalPages:  Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getThreads,
  getThreadById,
  createThread,
  updateThread,
  deleteThread,
  searchThreads,
  toggleSaveThread,
  getSavedThreads
};
