const jwt    = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { JWT_SECRET, GOOGLE_CLIENT_ID } = require('../config/env');

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Shared shape returned to the client on any successful auth operation.
// Deliberately omits passwordHash and other sensitive internals.
const buildUserResponse = (user) => ({
  _id:               user._id,
  username:          user.username,
  email:             user.email,
  avatarUrl:         user.avatarUrl || '',
  role:              user.role,
  authProvider:      user.authProvider,
  interests:         user.interests || [],
  savedThreads:      user.savedThreads || [],
  credibilityScore:  user.credibilityScore,
  isSuspended:       user.isSuspended,
  pinnedCommunities: user.pinnedCommunities || {},
  createdAt:         user.createdAt
});

// POST /api/auth/register
// Creates a new local account. If the email already belongs to a Google-only
// account, we merge it into a 'both' provider account instead of returning an error.
const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // Allow a Google-only account to add a local password (account merge)
      if (existingUser.authProvider === 'google' && !existingUser.passwordHash) {
        existingUser.passwordHash = password; // pre-save hook handles hashing

        // Only switch the username if the requested one is actually free
        if (existingUser.username !== username) {
          const usernameTaken = await User.findOne({ username });
          if (!usernameTaken) {
            existingUser.username = username;
          }
        }

        existingUser.authProvider = 'both';
        await existingUser.save();

        const token = jwt.sign({ id: existingUser._id }, JWT_SECRET, { expiresIn: '7d' });
        return res.status(200).json({ token, user: buildUserResponse(existingUser) });
      }
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const usernameTaken = await User.findOne({ username });
    if (usernameTaken) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const user = new User({ username, email, passwordHash: password });
    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: buildUserResponse(user) });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // Accounts created via Google Sign-In have no local password until the
    // user explicitly sets one through the register / change-password flow.
    if (user.authProvider === 'google' && !user.passwordHash) {
      return res.status(400).json({
        message: 'This account was created with Google. Please sign in with Google, or register locally to set a password.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ token, user: buildUserResponse(user) });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me  — returns the authenticated user's profile
const getMe = async (req, res, next) => {
  try {
    res.status(200).json(buildUserResponse(req.user));
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/google
// Verifies a Google ID token and either creates a new account or signs into
// an existing one. Supports the 'test-token' shortcut for internal dev testing only.
const googleLogin = async (req, res, next) => {
  try {
    const { idToken, mockEmail, mockName, mockId } = req.body;

    let payload;
    if (idToken === 'test-token') {
      payload = { email: mockEmail, name: mockName, sub: mockId };
    } else {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    }

    const { email, name, sub: googleId } = payload;

    let user = await User.findOne({ email });

    if (user) {
      // Existing local-only account — attach the Google identity to it
      if (user.authProvider === 'local') {
        user.googleId    = googleId;
        user.authProvider = 'both';
        await user.save();
      }
    } else {
      // Derive a username from the Google display name; append a counter if taken
      const baseUsername = name.replace(/\s+/g, '').toLowerCase();
      let username = baseUsername;
      let usernameExists = await User.findOne({ username });
      let counter = 1;
      while (usernameExists) {
        username = `${baseUsername}${counter}`;
        usernameExists = await User.findOne({ username });
        counter++;
      }

      user = new User({ username, email, googleId, authProvider: 'google' });
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ token, user: buildUserResponse(user) });

  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({ message: 'Invalid Google token' });
  }
};

// PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const { username, avatarUrl } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (username !== undefined) {
      const nextUsername = String(username).trim();
      if (!nextUsername) return res.status(400).json({ message: 'Username cannot be empty' });
      if (nextUsername !== user.username) {
        const existing = await User.findOne({ username: nextUsername });
        if (existing && existing._id.toString() !== userId.toString()) {
          return res.status(400).json({ message: 'Username is already taken' });
        }
        user.username = nextUsername;
      }
    }

    if (avatarUrl !== undefined) {
      user.avatarUrl = String(avatarUrl).trim() || '';
    }

    if (req.body.pinnedCommunities !== undefined) {
      user.pinnedCommunities = req.body.pinnedCommunities;
    }

    await user.save();
    res.status(200).json(buildUserResponse(user));
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/password
// Google-only users can call this without a currentPassword to set one for the
// first time. All other users must provide their current password.
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.passwordHash) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required' });
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.passwordHash = newPassword;
    if (user.authProvider === 'google') {
      // Upgrade provider so the user can now sign in either way
      user.authProvider = 'both';
    }
    await user.save();

    res.status(200).json({ message: 'Password updated successfully', authProvider: user.authProvider });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, googleLogin, updateProfile, changePassword };
