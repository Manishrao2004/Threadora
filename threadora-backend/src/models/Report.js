const mongoose = require('mongoose');

// A Report is created when a user flags a thread or comment.
// Exactly one of threadId / commentId should be set per document.
const reportSchema = new mongoose.Schema({
  threadId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Thread' },
  commentId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason:     { type: String, required: true },
  message:    { type: String } // Optional free-text elaboration from the reporter
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
