const { NODE_ENV } = require('../config/env');

/**
 * Centralised error handler — must be the last app.use() call in index.js.
 *
 * Maps known Mongoose error types to appropriate HTTP status codes so that
 * callers get structured, predictable error shapes instead of raw 500s.
 * Stack traces are hidden in production to avoid leaking implementation details.
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${err.name}: ${err.message}`);

  let statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  let message    = err.message || 'Internal Server Error';

  // Mongoose schema validation failure (e.g. required field missing)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message    = Object.values(err.errors).map(v => v.message).join(', ');
  }

  // Invalid ObjectId (e.g. /api/threads/not-an-id)
  if (err.name === 'CastError') {
    statusCode = 400;
    message    = `Invalid ${err.path}: ${err.value}`;
  }

  // Unique-index violation (e.g. duplicate username or email)
  if (err.code === 11000) {
    statusCode = 400;
    message    = 'A record with that value already exists';
  }

  res.status(statusCode).json({
    message,
    status: 'error',
    stack:  NODE_ENV === 'production' ? undefined : err.stack
  });
};


module.exports = errorHandler;
