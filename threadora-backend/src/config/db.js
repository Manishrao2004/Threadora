const mongoose = require('mongoose');
const { MONGODB_URI } = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);

    // ── One-time index migration ─────────────────────────────────────────────
    // The Vote model originally had a simple unique index on { threadId, userId }
    // without a partialFilterExpression. This caused phantom unique-key violations
    // when a user voted on both a thread and a comment in the same session (because
    // both documents would have the same userId and a null threadId).
    //
    // We now use partial unique indexes (see Vote.js) that only enforce uniqueness
    // when the indexed field is present and non-null. On first startup after this
    // change, we drop the old un-filtered index so Mongoose can create the correct one.
    try {
      const votesCollection = conn.connection.db.collection('votes');
      const indexes = await votesCollection.indexes();
      for (const idx of indexes) {
        if (
          idx.key?.threadId &&
          idx.key?.userId &&
          idx.unique &&
          !idx.partialFilterExpression
        ) {
          console.log('Dropping legacy Vote index:', idx.name);
          await votesCollection.dropIndex(idx.name);
        }
      }
    } catch (migrationErr) {
      // Code 26 = NamespaceNotFound — collection doesn't exist yet on a fresh DB
      if (migrationErr.code !== 26) {
        console.warn('Vote index migration warning:', migrationErr.message);
      }
    }
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
