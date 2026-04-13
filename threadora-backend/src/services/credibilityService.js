const User = require('../models/User');

// Point values for each event that can affect a user's credibility score.
// Negative values are penalties; positive values are rewards.
const CREDIBILITY_SCORES = {
  CREATE_CONTENT:  1,   // Posting a thread or comment
  RECEIVE_UPVOTE:  2,   // Someone upvoted your content
  RECEIVE_DOWNVOTE: -1, // Someone downvoted your content
  SYSTEM_FLAGGED:  -5,  // Post tripped the keyword filter
  ADMIN_DELETION: -10   // An admin deleted your post
};

// Auto-suspend threshold: if a user's score drops to or below this value
// their account is suspended automatically.
const SUSPENSION_THRESHOLD = -50;

/**
 * Adjusts a user's credibility score by `points` and persists the change.
 *
 * Auto-suspension kicks in when the score reaches SUSPENSION_THRESHOLD.
 * Admins and SuperAdmins are excluded from auto-suspension (they can still be
 * manually suspended by a SuperAdmin through the admin panel).
 *
 * The reverse path (score rising back above the threshold) auto-lifts the
 * suspension so recovered accounts don't stay locked indefinitely.
 *
 * Returns the updated user document, or null if the user was not found.
 */
const changeUserCredibility = async (userId, points) => {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    user.credibilityScore += points;

    if (user.credibilityScore <= SUSPENSION_THRESHOLD && !user.isSuspended) {
      if (user.role !== 'admin' && user.role !== 'superadmin') {
        user.isSuspended = true;
      }
    } else if (user.credibilityScore > SUSPENSION_THRESHOLD && user.isSuspended) {
      user.isSuspended = false;
    }

    await user.save();
    return user;
  } catch (error) {
    console.error('credibilityService error:', error);
  }
};

module.exports = { CREDIBILITY_SCORES, changeUserCredibility };
