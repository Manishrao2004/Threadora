const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  // Exactly one of threadId / commentId is set per document (polymorphic target).
  threadId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Thread' },
  commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:      { type: String, enum: ['upvote', 'downvote'], required: true }
}, { timestamps: true });

// Partial unique indexes prevent a user from voting twice on the same target,
// while also allowing the same (userId) to appear with the other target type
// (no false unique-key conflicts when commentId is absent on a thread vote).
voteSchema.index(
  { threadId: 1, userId: 1 },
  { unique: true, partialFilterExpression: { threadId: { $exists: true, $ne: null } } }
);
voteSchema.index(
  { commentId: 1, userId: 1 },
  { unique: true, partialFilterExpression: { commentId: { $exists: true, $ne: null } } }
);

module.exports = mongoose.model('Vote', voteSchema);
