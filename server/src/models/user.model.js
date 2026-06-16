const { query } = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * User Model — raw PostgreSQL queries (no ORM)
 * All database interactions for the users table
 */

/**
 * Find a user by their email address
 */
const findByEmail = async (email) => {
  const res = await query(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  return res.rows[0] || null;
};

/**
 * Find a user by their UUID
 */
const findById = async (id) => {
  const res = await query(
    'SELECT id, email, username, display_name, avatar_url, role, google_id, email_verified, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );
  return res.rows[0] || null;
};

/**
 * Find a user by their username
 */
const findByUsername = async (username) => {
  const res = await query(
    'SELECT id, username FROM users WHERE username = $1',
    [username.toLowerCase()]
  );
  return res.rows[0] || null;
};

/**
 * Find a user by their Google OAuth ID
 */
const findByGoogleId = async (googleId) => {
  const res = await query(
    'SELECT * FROM users WHERE google_id = $1',
    [googleId]
  );
  return res.rows[0] || null;
};

/**
 * Create a new user with email + password (hashed)
 */
const createUser = async ({ email, username, displayName, password }) => {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const passwordHash = await bcrypt.hash(password, rounds);

  const res = await query(
    `INSERT INTO users (email, username, display_name, password_hash, email_verified)
     VALUES ($1, $2, $3, $4, FALSE)
     RETURNING id, email, username, display_name, avatar_url, role, email_verified, created_at`,
    [email.toLowerCase(), username.toLowerCase(), displayName, passwordHash]
  );
  return res.rows[0];
};

/**
 * Create a new user via Google OAuth (no password)
 */
const createGoogleUser = async ({ email, googleId, displayName, username, avatarUrl }) => {
  const res = await query(
    `INSERT INTO users (email, username, display_name, google_id, avatar_url, email_verified)
     VALUES ($1, $2, $3, $4, $5, TRUE)
     RETURNING id, email, username, display_name, avatar_url, role, email_verified, created_at`,
    [email.toLowerCase(), username, displayName, googleId, avatarUrl]
  );
  return res.rows[0];
};

/**
 * Link a Google account to an existing email-based user
 */
const linkGoogleAccount = async (userId, googleId, avatarUrl) => {
  const res = await query(
    `UPDATE users
     SET google_id = $1, avatar_url = COALESCE(avatar_url, $2), email_verified = TRUE, updated_at = NOW()
     WHERE id = $3
     RETURNING id, email, username, display_name, avatar_url, role, email_verified`,
    [googleId, avatarUrl, userId]
  );
  return res.rows[0];
};

/**
 * Update a user's password by their ID
 */
const updatePassword = async (userId, newPassword) => {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const passwordHash = await bcrypt.hash(newPassword, rounds);

  const res = await query(
    `UPDATE users SET password_hash = $1, updated_at = NOW()
     WHERE id = $2 RETURNING id`,
    [passwordHash, userId]
  );
  return res.rows[0];
};

/**
 * Update user profile fields
 */
const updateProfile = async (userId, { displayName, avatarUrl }) => {
  const res = await query(
    `UPDATE users
     SET display_name = COALESCE($1, display_name),
         avatar_url = COALESCE($2, avatar_url),
         updated_at = NOW()
     WHERE id = $3
     RETURNING id, email, username, display_name, avatar_url, role, email_verified, created_at`,
    [displayName, avatarUrl, userId]
  );
  return res.rows[0];
};

/**
 * Verify a plain password against the stored hash
 */
const verifyPassword = async (plainPassword, hash) => {
  if (!hash) return false; // Google-only users have no password
  return bcrypt.compare(plainPassword, hash);
};

/**
 * Store a hashed refresh token for a user session
 */
const storeRefreshToken = async ({ userId, tokenHash, deviceInfo, ipAddress, expiresAt }) => {
  const res = await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, device_info, ip_address, expires_at)
     VALUES ($1, $2, $3, $4::inet, $5)
     RETURNING id`,
    [userId, tokenHash, deviceInfo, ipAddress, expiresAt]
  );
  return res.rows[0];
};

/**
 * Find a valid (non-revoked, non-expired) refresh token record
 */
const findRefreshToken = async (tokenHash) => {
  const res = await query(
    `SELECT rt.*, u.id as user_id, u.role, u.email
     FROM refresh_tokens rt
     JOIN users u ON rt.user_id = u.id
     WHERE rt.token_hash = $1
       AND rt.revoked = FALSE
       AND rt.expires_at > NOW()`,
    [tokenHash]
  );
  return res.rows[0] || null;
};

/**
 * Revoke a specific refresh token (logout from one device)
 */
const revokeRefreshToken = async (tokenHash) => {
  await query(
    'UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1',
    [tokenHash]
  );
};

/**
 * Revoke ALL refresh tokens for a user (logout from all devices)
 */
const revokeAllUserTokens = async (userId) => {
  await query(
    'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1',
    [userId]
  );
};

/**
 * Get all active sessions for a user (for profile page session management)
 */
const getUserSessions = async (userId) => {
  const res = await query(
    `SELECT id, device_info, ip_address, created_at, expires_at
     FROM refresh_tokens
     WHERE user_id = $1 AND revoked = FALSE AND expires_at > NOW()
     ORDER BY created_at DESC`,
    [userId]
  );
  return res.rows;
};

/**
 * Store a password reset token
 */
const storeResetToken = async (userId, tokenHash) => {
  // Invalidate any previous reset tokens for this user first
  await query(
    'UPDATE password_reset_tokens SET used = TRUE WHERE user_id = $1',
    [userId]
  );

  const expiresAt = new Date(Date.now() + parseInt(process.env.RESET_TOKEN_EXPIRY_MS || 3600000));
  const res = await query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3) RETURNING id`,
    [userId, tokenHash, expiresAt]
  );
  return res.rows[0];
};

/**
 * Find and validate a password reset token
 */
const findResetToken = async (tokenHash) => {
  const res = await query(
    `SELECT prt.*, u.email, u.id as user_id
     FROM password_reset_tokens prt
     JOIN users u ON prt.user_id = u.id
     WHERE prt.token_hash = $1
       AND prt.used = FALSE
       AND prt.expires_at > NOW()`,
    [tokenHash]
  );
  return res.rows[0] || null;
};

/**
 * Mark a reset token as used (single-use enforcement)
 */
const markResetTokenUsed = async (tokenHash) => {
  await query(
    'UPDATE password_reset_tokens SET used = TRUE WHERE token_hash = $1',
    [tokenHash]
  );
};

module.exports = {
  findByEmail,
  findById,
  findByUsername,
  findByGoogleId,
  createUser,
  createGoogleUser,
  linkGoogleAccount,
  updatePassword,
  updateProfile,
  verifyPassword,
  storeRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  getUserSessions,
  storeResetToken,
  findResetToken,
  markResetTokenUsed,
};
