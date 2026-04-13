const Thread = require('../models/Thread');

/**
 * Recomputes and persists the ranking score for a single thread.
 *
 * Formula:
 *   score = (2 × upvotes) − (2 × downvotes) + (1 × comments) + recencyWeight
 *
 * recencyWeight starts at 100 and decays by 2 points per hour, flooring at 0.
 * This means a thread loses its recency bonus after ~50 hours, after which its
 * score is driven purely by engagement (votes + comments).
 *
 * Called after every vote and every new comment so the feed stays up-to-date.
 *
 * @param  {string|ObjectId} threadId
 * @returns {number|null} The new score, or null if the thread wasn't found.
 */
const updateThreadScore = async (threadId) => {
  try {
    const thread = await Thread.findById(threadId);
    if (!thread) return null;

    const hoursSinceCreation = Math.max(
      0,
      (Date.now() - new Date(thread.createdAt).getTime()) / (1000 * 60 * 60)
    );

    const recencyWeight = Math.max(0, 100 - hoursSinceCreation * 2);

    thread.score = (2 * thread.upvotes) - (2 * thread.downvotes) + thread.commentCount + recencyWeight;

    await thread.save();
    return thread.score;
  } catch (err) {
    console.error('rankingService.updateThreadScore error:', err);
    throw err;
  }
};

module.exports = { updateThreadScore };
