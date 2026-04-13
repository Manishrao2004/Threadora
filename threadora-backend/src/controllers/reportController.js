const Report  = require('../models/Report');
const Thread  = require('../models/Thread');
const Comment = require('../models/Comment');
const { handleNewReport } = require('../services/moderationService');

// POST /api/reports
// Either threadId or commentId must be present. When reporting a comment without
// an explicit threadId, we look it up from the comment so the report record stays
// consistent (reportCount lives on the parent document).
// Duplicate reports (same user, same target) are rejected to prevent score inflation.
const createReport = async (req, res, next) => {
  try {
    const { threadId, commentId, reason, message } = req.body;

    if (!commentId && !threadId) {
      return res.status(400).json({ message: 'Must report a thread or comment' });
    }

    let resolvedThreadId = threadId;
    if (commentId && !resolvedThreadId) {
      const parentComment = await Comment.findById(commentId).select('threadId');
      if (parentComment) resolvedThreadId = parentComment.threadId;
    }

    const duplicateQuery = { reportedBy: req.user._id };
    if (commentId) duplicateQuery.commentId  = commentId;
    else           duplicateQuery.threadId   = resolvedThreadId;

    const existing = await Report.findOne(duplicateQuery);
    if (existing) {
      return res.status(400).json({ message: 'You have already reported this content' });
    }

    const report = new Report({
      threadId:   resolvedThreadId || undefined,
      commentId:  commentId        || undefined,
      reportedBy: req.user._id,
      reason,
      message
    });

    await report.save();

    // Increment reportCount on the target; auto-hide if the threshold is reached
    await handleNewReport(resolvedThreadId, commentId);

    res.status(201).json({ message: 'Report submitted successfully' });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports  (Admin only — enforced at the route level)
const getReports = async (req, res, next) => {
  try {
    const reports = await Report.find()
      .populate('threadId', 'title isHidden reportCount')
      .populate({
        path:     'commentId',
        select:   'content isHidden reportCount threadId',
        populate: { path: 'threadId', select: 'title' }
      })
      .populate('reportedBy', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json(reports);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/reports/:id  (Admin "Dismiss" action)
// Deletes the report and decrements the target's reportCount.
// If the count drops below the auto-hide threshold, the content is made visible again.
// Note: this does NOT reverse the credibility penalty applied when the report was
// *submitted* — that would require a separate "clear credibility" admin action.
const resolveReport = async (req, res, next) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const HIDE_THRESHOLD = 5;

    if (report.threadId) {
      const thread = await Thread.findById(report.threadId);
      if (thread) {
        thread.reportCount = Math.max(0, thread.reportCount - 1);
        if (thread.reportCount < HIDE_THRESHOLD && thread.isHidden) {
          thread.isHidden = false;
        }
        await thread.save();
      }
    }

    if (report.commentId) {
      const comment = await Comment.findById(report.commentId);
      if (comment) {
        comment.reportCount = Math.max(0, comment.reportCount - 1);
        if (comment.reportCount < HIDE_THRESHOLD && comment.isHidden) {
          comment.isHidden = false;
        }
        await comment.save();
      }
    }

    res.status(200).json({ message: 'Report resolved and dismissed' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createReport, getReports, resolveReport };
