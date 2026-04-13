const Thread       = require('../models/Thread');
const SystemConfig = require('../models/SystemConfig');

/**
 * Checks whether any of the provided text strings contain a blocked keyword.
 *
 * Word-boundary matching is used so that short keywords like 'ass' don't
 * falsely match words such as 'glass' or 'classic'.
 *
 * @param  {...string} texts - One or more text strings to check (e.g. title, content)
 * @returns {{ isClean: boolean, triggeredWord?: string }}
 */
const checkContentAgainstRules = async (...texts) => {
  const config = await SystemConfig.findOne();
  if (!config || !config.blockedKeywords || config.blockedKeywords.length === 0) {
    return { isClean: true };
  }

  const combinedText = texts.filter(Boolean).join(' ').toLowerCase();

  for (const word of config.blockedKeywords) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(combinedText)) {
      return { isClean: false, triggeredWord: word };
    }
  }

  return { isClean: true };
};

/**
 * Called after every new report is saved. Increments the target's reportCount
 * and hides it automatically once the threshold is reached.
 *
 * The 5-report threshold is intentionally hardcoded here and in resolveReport
 * so the auto-hide behaviour is consistent without needing config lookups on
 * every report event (keeps the hot path fast).
 */
const handleNewReport = async (threadId, commentId) => {
  try {
    const HIDE_THRESHOLD = 5;

    if (commentId) {
      // Lazy-loaded to avoid a circular require through Comment -> Thread
      const Comment = require('../models/Comment');
      const comment = await Comment.findById(commentId);
      if (!comment) return;

      comment.reportCount += 1;
      if (comment.reportCount >= HIDE_THRESHOLD && !comment.isHidden) {
        comment.isHidden = true;
      }
      await comment.save();
      return comment;
    }

    if (threadId) {
      const thread = await Thread.findById(threadId);
      if (!thread) return;

      thread.reportCount += 1;
      if (thread.reportCount >= HIDE_THRESHOLD && !thread.isHidden) {
        thread.isHidden = true;
      }
      await thread.save();
      return thread;
    }
  } catch (error) {
    console.error('moderationService.handleNewReport error:', error);
    throw error;
  }
};

module.exports = { handleNewReport, checkContentAgainstRules };
