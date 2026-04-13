const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username:       { type: String, required: true, unique: true },
  email:          { type: String, required: true, unique: true },
  avatarUrl:      { type: String },
  passwordHash:   { type: String }, // Nullable — Google-only accounts have no local password
  role:           { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
  interests:      [{ type: String }],
  googleId:       { type: String, unique: true, sparse: true },
  authProvider:   { type: String, enum: ['local', 'google', 'both'], default: 'local' },
  credibilityScore: { type: Number, default: 0 },
  isSuspended:    { type: Boolean, default: false },
  savedThreads:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Thread' }],
  // Map of categoryId -> order position, used to pin communities in the sidebar
  pinnedCommunities: { type: Map, of: Number, default: {} }
}, { timestamps: true });

// Hash the password before saving whenever `passwordHash` is modified.
// The raw password is written to `passwordHash` by callers; this hook
// replaces it with the bcrypt digest so plain-text is never persisted.
userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash') || !this.passwordHash) return;
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Returns false immediately for accounts that have no local password set
// (pure Google sign-in), avoiding a bcrypt call against a null hash.
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
