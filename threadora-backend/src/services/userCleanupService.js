const User    = require('../models/User');
const Thread  = require('../models/Thread');
const Comment = require('../models/Comment');
const Vote    = require('../models/Vote');
const Report  = require('../models/Report');

/**
 * Fully removes a user and every piece of content they authored.
 *
 * Deletion order:
 *   1. Comments on the user's threads (must precede thread deletion)
 *   2. Votes on the user's threads
 *   3. Reports against the user's threads
 *   4. The user's threads themselves
 *   5. Comments the user left on *other people's* threads
 *   6. Votes the user cast anywhere
 *   7. Reports the user submitted
 *   8. The user document
 *
 * Steps 1-4 and 5-7 are each run in parallel via Promise.all. Step 8 is
 * sequential because it must succeed after everything else is gone.
 *
 * @param  {string|ObjectId} userId
 * @returns {User|null} The deleted user document, or null if not found.
 */
const deleteUserAndContent = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return null;

  const userThreads = await Thread.find({ authorId: userId });
  const threadIds   = userThreads.map(t => t._id);

  if (threadIds.length > 0) {
    await Promise.all([
      Comment.deleteMany({ threadId:  { $in: threadIds } }),
      Vote.deleteMany(   { threadId:  { $in: threadIds } }),
      Report.deleteMany( { threadId:  { $in: threadIds } }),
      Thread.deleteMany( { authorId:  userId             })
    ]);
  }

  // Clean up the user's activity on other threads
  await Promise.all([
    Comment.deleteMany({ authorId:   userId }),
    Vote.deleteMany(   { userId            }),
    Report.deleteMany( { reportedBy:  userId })
  ]);

  await User.deleteOne({ _id: userId });
  return user;
};

module.exports = { deleteUserAndContent };
