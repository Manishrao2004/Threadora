const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  threadId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Thread', required: true },
  authorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null }, // null = top-level comment
  content:    { type: String, required: true },
  media:      [{ url: String, type: { type: String, enum: ['image', 'video'] } }],
  upvotes:    { type: Number, default: 0 },
  downvotes:  { type: Number, default: 0 },
  score:      { type: Number, default: 0 },
  replyCount: { type: Number, default: 0 },
  reportCount:{ type: Number, default: 0 },
  isHidden:   { type: Boolean, default: false },
  moderationStatus: { type: String, enum: ['approved', 'flagged', 'rejected'], default: 'approved' },
  systemFlagReason: { type: String, default: null },
  isEdited:   { type: Boolean, default: false },
  // Soft-delete flag: content is blanked but the document is kept to preserve thread continuity
  isDeleted:  { type: Boolean, default: false }
}, { timestamps: true });

// Primary read path: fetch all comments for a thread ordered by creation time
commentSchema.index({ threadId: 1, createdAt: 1 });
// Used when building nested reply trees
commentSchema.index({ parentId: 1 });
// Top-level sort by score when rendering "best" comments first
commentSchema.index({ score: -1 });

module.exports = mongoose.model('Comment', commentSchema);
