const rateLimit = require('express-rate-limit');

/**
 * Rate Limiters — brute-force protection for auth endpoints
 */

/**
 * Strict limiter for login and registration
 * 10 requests per 15 minutes per IP
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts. Please try again in 15 minutes.',
  },
  skipSuccessfulRequests: false,
});

/**
 * Moderate limiter for forgot-password endpoint
 * 5 requests per hour per IP (prevent email bombing)
 */
const forgotPasswordRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again in 1 hour.',
  },
});

/**
 * General API rate limiter
 * 100 requests per minute per IP
 */
const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
  },
});

module.exports = { authRateLimiter, forgotPasswordRateLimiter, apiRateLimiter };
