const rateLimit = require('express-rate-limit');

// 10,000 requests per 15-minute window per IP.
// This is intentionally generous for development / ngrok usage.
// Tighten this (e.g. 300 req / 15 min) before going to production.
const apiLimiter = rateLimit({
  windowMs:       15 * 60 * 1000,
  max:            10000,
  message:        { message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders:  false,
});

module.exports = apiLimiter;
