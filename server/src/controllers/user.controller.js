const userModel = require('../models/user.model');

/**
 * User Controller — profile and session management
 */

/**
 * GET /api/users/sessions
 * List all active sessions for the current user
 * Used on the Profile page for session management
 */
const getSessions = async (req, res, next) => {
  try {
    const sessions = await userModel.getUserSessions(req.user.id);
    return res.json({ success: true, data: { sessions } });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/users/sessions/:sessionId
 * Revoke a specific session by its ID
 */
const revokeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    // Security: only allow users to revoke their own sessions
    const sessions = await userModel.getUserSessions(req.user.id);
    const sessionBelongsToUser = sessions.some((s) => s.id === sessionId);

    if (!sessionBelongsToUser) {
      return res.status(403).json({
        success: false,
        message: 'Session not found or unauthorized',
      });
    }

    // Revoke by ID (find token hash, revoke it)
    const { query } = require('../config/db');
    await query('UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1', [sessionId]);

    return res.json({ success: true, message: 'Session revoked' });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/profile
 * Update user display name and/or avatar URL
 */
const updateProfile = async (req, res, next) => {
  try {
    const { display_name, avatar_url } = req.body;

    const updatedUser = await userModel.updateProfile(req.user.id, {
      displayName: display_name,
      avatarUrl: avatar_url,
    });

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/users/change-password
 * Change password for email-based accounts
 */
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    // Fetch full user record (includes password_hash)
    const { query } = require('../config/db');
    const res2 = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const user = res2.rows[0];

    if (!user?.password_hash) {
      return res.status(400).json({
        success: false,
        message: 'Password change is not available for Google-linked accounts',
      });
    }

    const isValid = await userModel.verifyPassword(current_password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    await userModel.updatePassword(req.user.id, new_password);

    // Revoke all other sessions for security
    await userModel.revokeAllUserTokens(req.user.id);

    return res.json({
      success: true,
      message: 'Password changed successfully. Please log in again.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/:id/public
 * Get public profile data for any user (no auth required)
 */
const getPublicProfile = async (req, res, next) => {
  try {
    const { query } = require('../config/db');
    const result = await query(
      `SELECT id, username, display_name, avatar_url, role, created_at
       FROM users WHERE id = $1`,
      [req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, data: { user: result.rows[0] } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSessions, revokeSession, updateProfile, changePassword, getPublicProfile };
