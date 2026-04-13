const User    = require('../models/User');
const Thread  = require('../models/Thread');
const Comment = require('../models/Comment');
const Vote    = require('../models/Vote');
const Report  = require('../models/Report');
const { deleteUserAndContent } = require('../services/userCleanupService');

// GET /api/admin/stats
exports.getSystemStats = async (req, res, next) => {
  try {
    const [userCount, threadCount, commentCount, voteCount] = await Promise.all([
      User.countDocuments(),
      Thread.countDocuments(),
      Comment.countDocuments(),
      Vote.countDocuments()
    ]);

    res.status(200).json({
      totalUsers:  userCount,
      totalThreads: threadCount,
      // Engagement = comments + votes (a simple activity proxy for the dashboard)
      engagements: commentCount + voteCount
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/users — returns all users without password hashes
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/users/:id/role  (SuperAdmin only)
// A SuperAdmin's own role can never be changed — they're the top of the hierarchy.
// Admins cannot elevate themselves; only SuperAdmins reach this endpoint.
exports.updateUserRole = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    if (req.user && req.user._id.toString() === targetUserId) {
      return res.status(403).json({ message: 'You cannot change your own role.' });
    }

    const { role } = req.body;
    if (!['user', 'admin', 'superadmin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    if (targetUser.role === 'superadmin') {
      return res.status(403).json({ message: 'SuperAdmins are immune to role modifications.' });
    }

    targetUser.role = role;
    await targetUser.save();

    const userObj = targetUser.toObject();
    delete userObj.passwordHash;
    res.status(200).json(userObj);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/users/:id  (SuperAdmin only)
// Delegates to userCleanupService which cascade-deletes all content authored by the user.
exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    if (req.user && req.user._id.toString() === userId) {
      return res.status(403).json({ message: 'You cannot delete your own account.' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    if (targetUser.role === 'superadmin') {
      return res.status(403).json({ message: 'SuperAdmins cannot be deleted via the dashboard.' });
    }

    await deleteUserAndContent(userId);
    res.status(200).json({ message: 'User and all associated content deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/users/:id/suspend
// Admins can suspend regular users; only SuperAdmins can suspend other Admins.
// Unsuspending also resets a heavily negative credibility score back to zero to
// give the user a clean slate after serving their suspension.
exports.toggleUserSuspension = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const actorRole    = req.user.role;

    if (req.user && req.user._id.toString() === targetUserId) {
      return res.status(403).json({ message: 'You cannot change your own suspension status.' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    if (targetUser.role === 'superadmin') {
      return res.status(403).json({ message: 'SuperAdmins are immune to suspension.' });
    }

    if (actorRole === 'admin' && targetUser.role === 'admin') {
      return res.status(403).json({ message: 'Admins cannot suspend other Admins.' });
    }

    targetUser.isSuspended = !targetUser.isSuspended;
    if (!targetUser.isSuspended && targetUser.credibilityScore < 0) {
      targetUser.credibilityScore = 0;
    }
    await targetUser.save();

    const userObj = targetUser.toObject();
    delete userObj.passwordHash;
    res.status(200).json(userObj);
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/moderation-queue
// Returns all flagged threads and comments merged into a single, time-sorted list.
exports.getModerationQueue = async (req, res, next) => {
  try {
    const threads = await Thread.find({ moderationStatus: 'flagged' })
      .populate('authorId', 'username credibilityScore isSuspended')
      .lean();

    const comments = await Comment.find({ moderationStatus: 'flagged' })
      .populate('authorId', 'username credibilityScore isSuspended')
      .populate('threadId', '_id title')
      .lean();

    const queue = [
      ...threads.map(t => ({ ...t, itemType: 'thread' })),
      ...comments.map(c => ({ ...c, itemType: 'comment' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json(queue);
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/moderation-queue/:id/approve
// Makes the item publicly visible again and refunds the credibility penalty
// that was applied when the content was auto-flagged.
exports.approveModerationItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { itemType } = req.body;
    const { CREDIBILITY_SCORES, changeUserCredibility } = require('../services/credibilityService');

    let item;
    if (itemType === 'thread') {
      item = await Thread.findById(id);
    } else {
      item = await Comment.findById(id);
    }

    if (!item) return res.status(404).json({ message: 'Item not found' });

    item.isHidden         = false;
    item.moderationStatus = 'approved';
    await item.save();

    // Refund the SYSTEM_FLAGGED penalty as a positive delta
    await changeUserCredibility(item.authorId, Math.abs(CREDIBILITY_SCORES.SYSTEM_FLAGGED));

    res.status(200).json({ message: 'Item approved successfully', item });
  } catch (error) {
    next(error);
  }
};
