const mongoose = require('mongoose');

const threadSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  content:  { type: String, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  authorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  media:    [{ url: String, type: { type: String, enum: ['image', 'video'] } }],
  upvotes:  { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  reportCount:  { type: Number, default: 0 },
  score:    { type: Number, default: 0 }, // Computed ranking score (upvotes, comments, recency)
  isHidden: { type: Boolean, default: false },
  moderationStatus: { type: String, enum: ['approved', 'flagged', 'rejected'], default: 'approved' },
  systemFlagReason: { type: String, default: null }, // Set when auto-flagged by keyword filter
  isEdited: { type: Boolean, default: false }
}, { timestamps: true });

// Compound index for paginated category feeds
threadSchema.index({ categoryId: 1 });
// Reverse-chronological queries (new feed)
threadSchema.index({ createdAt: -1 });
// Trending feed — sorted by precomputed score
threadSchema.index({ score: -1 });
// Full-text search across title and body
threadSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('Thread', threadSchema);
