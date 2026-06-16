const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Token Service — manages JWT access tokens and refresh tokens
 */

/**
 * Signs a short-lived JWT access token (default: 15 minutes)
 * Contains user ID and role for authorization middleware
 */
const signAccessToken = (payload) => {
  return jwt.sign(
    { sub: payload.id, role: payload.role, email: payload.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
};

/**
 * Signs a long-lived JWT refresh token (default: 7 days)
 * Only contains user ID — role is re-fetched from DB on refresh
 */
const signRefreshToken = (payload) => {
  const expiresInDays = parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS) || 7;
  return jwt.sign(
    { sub: payload.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: `${expiresInDays}d` }
  );
};

/**
 * Verify and decode a JWT access token
 * Throws error if token is invalid or expired
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

/**
 * Verify and decode a JWT refresh token
 * Throws error if token is invalid or expired
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

/**
 * Generate a cryptographically secure random token for password reset
 * Returns both the raw token (for the email link) and the hash (stored in DB)
 */
const generateResetToken = () => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, tokenHash };
};

/**
 * Hash a refresh token for secure storage in the database
 * We store the hash, not the raw token, for security
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Calculate refresh token expiry date
 */
const getRefreshTokenExpiry = () => {
  const days = parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS) || 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateResetToken,
  hashToken,
  getRefreshTokenExpiry,
};
