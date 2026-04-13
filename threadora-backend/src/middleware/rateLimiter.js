const rateLimit = require('express-rate-limit');
const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX, NODE_ENV } = require('../config/env');

/**
 * Global API rate limiter.
 *
 * Limits are pulled from environment variables so they can be tuned per
 * environment without a code deploy:
 *
 *   RATE_LIMIT_WINDOW_MS  — rolling window in milliseconds (default: 15 min)
 *   RATE_LIMIT_MAX        — max requests per IP per window
 *                           dev default  : 10,000  (effectively unlimited)
 *                           prod default :    500  (blocks only heavy abusers)
 *
 * 500 req / 15 min = ~33 req/min average.  A normal active user doing
 * infinite-scroll + voting + commenting might hit 2-5 req/min.  A bot
 * hammering the API would blow past 500 in seconds.
 *
 * Render note: Render sits behind a load balancer, so we must trust the
 * X-Forwarded-For header (set via app.set('trust proxy', 1) in index.js)
 * for IP-based limiting to work correctly.
 */
const apiLimiter = rateLimit({
  windowMs:        RATE_LIMIT_WINDOW_MS,
  max:             RATE_LIMIT_MAX,
  standardHeaders: true,   // Return RateLimit-* headers (RFC 6585)
  legacyHeaders:   false,  // Disable X-RateLimit-* legacy headers

  // Custom message so the client can surface a meaningful error
  message: {
    message: `Too many requests. You have exceeded ${RATE_LIMIT_MAX} requests in a ${RATE_LIMIT_WINDOW_MS / 60000}-minute window. Please slow down.`,
    status: 'error'
  },

  // Skip rate limiting entirely in dev so hot-reload and seed scripts are never blocked
  skip: () => NODE_ENV !== 'production',
});

module.exports = apiLimiter;

