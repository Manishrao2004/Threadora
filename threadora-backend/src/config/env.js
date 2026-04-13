require('dotenv').config();

// All environment variables are centralised here so that callers import from
// config/env rather than accessing process.env directly throughout the codebase.

module.exports = {
  NODE_ENV:     process.env.NODE_ENV     || 'development',
  PORT:         process.env.PORT         || 3000,
  MONGODB_URI:  process.env.MONGODB_URI  || 'mongodb://127.0.0.1:27017/threadora',
  JWT_SECRET:   process.env.JWT_SECRET, // Mandatory: will be validated below
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,

  // Cloudinary (Media Uploads)
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY:    process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  // Email (Resend)
  RESEND_API_KEY: process.env.RESEND_API_KEY
};

// --- Validation ---
if (!module.exports.JWT_SECRET) {
  if (module.exports.NODE_ENV === 'production') {
    throw new Error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
  } else {
    console.warn('WARNING: JWT_SECRET is not defined. Using a temporary insecure secret for development.');
    module.exports.JWT_SECRET = 'dev-only-insecure-secret-please-set-one-in-dotenv';
  }
}

