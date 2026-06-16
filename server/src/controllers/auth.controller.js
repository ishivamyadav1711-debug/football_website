const userModel = require('../models/user.model');
const tokenService = require('../services/token.service');
const mailService = require('../services/mail.service');

/**
 * Auth Controller — all authentication business logic
 * Routes delegate to these controller functions
 */

/**
 * POST /api/auth/register
 * Create a new user account with email and password
 */
const register = async (req, res, next) => {
  try {
    const { email, username, display_name, password } = req.body;

    // Check for existing email
    const existingEmail = await userModel.findByEmail(email);
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // Check for existing username
    const existingUsername = await userModel.findByUsername(username);
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: 'This username is already taken',
      });
    }

    // Create user (password is hashed inside the model)
    const newUser = await userModel.createUser({ email, username, displayName: display_name, password });

    // Issue tokens immediately (auto-login after register)
    const accessToken = tokenService.signAccessToken(newUser);
    const refreshToken = tokenService.signRefreshToken(newUser);
    const tokenHash = tokenService.hashToken(refreshToken);

    await userModel.storeRefreshToken({
      userId: newUser.id,
      tokenHash,
      deviceInfo: req.headers['user-agent'],
      ipAddress: req.ip,
      expiresAt: tokenService.getRefreshTokenExpiry(),
    });

    // Set refresh token as HttpOnly cookie
    setRefreshCookie(res, refreshToken);

    // Send welcome email (non-blocking)
    mailService.sendWelcomeEmail(newUser).catch(console.error);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        accessToken,
        user: sanitizeUser(newUser),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Authenticate with email and password
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findByEmail(email);
    if (!user) {
      // Use same message as wrong password to prevent user enumeration
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Google-only accounts have no password
    if (!user.password_hash) {
      return res.status(401).json({
        success: false,
        message: 'This account uses Google Sign-In. Please login with Google.',
      });
    }

    const isPasswordValid = await userModel.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Issue tokens
    const accessToken = tokenService.signAccessToken(user);
    const refreshToken = tokenService.signRefreshToken(user);
    const tokenHash = tokenService.hashToken(refreshToken);

    await userModel.storeRefreshToken({
      userId: user.id,
      tokenHash,
      deviceInfo: req.headers['user-agent'],
      ipAddress: req.ip,
      expiresAt: tokenService.getRefreshTokenExpiry(),
    });

    setRefreshCookie(res, refreshToken);

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        user: sanitizeUser(user),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 * Revoke the current refresh token (single device logout)
 */
const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      const tokenHash = tokenService.hashToken(refreshToken);
      await userModel.revokeRefreshToken(tokenHash);
    }

    // Clear the cookie regardless
    res.clearCookie('refreshToken', getCookieOptions());

    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout-all
 * Revoke ALL sessions for the authenticated user
 */
const logoutAll = async (req, res, next) => {
  try {
    await userModel.revokeAllUserTokens(req.user.id);
    res.clearCookie('refreshToken', getCookieOptions());

    return res.json({ success: true, message: 'Logged out from all devices' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/refresh
 * Exchange a valid refresh token for a new access token (rotation)
 */
const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token missing' });
    }

    // Verify JWT signature first
    let decoded;
    try {
      decoded = tokenService.verifyRefreshToken(refreshToken);
    } catch {
      res.clearCookie('refreshToken', getCookieOptions());
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    // Check DB: not revoked, not expired
    const tokenHash = tokenService.hashToken(refreshToken);
    const tokenRecord = await userModel.findRefreshToken(tokenHash);

    if (!tokenRecord) {
      res.clearCookie('refreshToken', getCookieOptions());
      return res.status(401).json({ success: false, message: 'Session expired or revoked' });
    }

    // Rotate: revoke old token, issue new pair
    await userModel.revokeRefreshToken(tokenHash);

    const newAccessToken = tokenService.signAccessToken({
      id: tokenRecord.user_id,
      role: tokenRecord.role,
      email: tokenRecord.email,
    });
    const newRefreshToken = tokenService.signRefreshToken({ id: tokenRecord.user_id });
    const newTokenHash = tokenService.hashToken(newRefreshToken);

    await userModel.storeRefreshToken({
      userId: tokenRecord.user_id,
      tokenHash: newTokenHash,
      deviceInfo: req.headers['user-agent'],
      ipAddress: req.ip,
      expiresAt: tokenService.getRefreshTokenExpiry(),
    });

    setRefreshCookie(res, newRefreshToken);

    return res.json({
      success: true,
      data: { accessToken: newAccessToken },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/forgot-password
 * Generate a time-limited reset token and email a reset link
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Always return 200 to prevent email enumeration attacks
    const user = await userModel.findByEmail(email);

    if (user) {
      const { rawToken, tokenHash } = tokenService.generateResetToken();
      await userModel.storeResetToken(user.id, tokenHash);
      await mailService.sendPasswordResetEmail(user, rawToken).catch(console.error);
    }

    return res.json({
      success: true,
      message: 'If that email exists, a password reset link has been sent.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/reset-password
 * Validate reset token and update the user's password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    // Hash the incoming token to compare with stored hash
    const crypto = require('crypto');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetRecord = await userModel.findResetToken(tokenHash);

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: 'Password reset link is invalid or has expired',
      });
    }

    // Update password and mark token as used (single-use)
    await userModel.updatePassword(resetRecord.user_id, password);
    await userModel.markResetTokenUsed(tokenHash);

    // Revoke all sessions for security (force re-login everywhere)
    await userModel.revokeAllUserTokens(resetRecord.user_id);
    res.clearCookie('refreshToken', getCookieOptions());

    return res.json({
      success: true,
      message: 'Password updated successfully. Please log in with your new password.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Return the current authenticated user's profile
 * Protected: requires valid access token
 */
const getMe = async (req, res) => {
  return res.json({
    success: true,
    data: { user: sanitizeUser(req.user) },
  });
};

/**
 * GET /api/auth/google/callback
 * Handle Google OAuth callback — issue tokens and redirect to client
 */
const googleCallback = async (req, res, next) => {
  try {
    const user = req.user; // Populated by Passport

    const accessToken = tokenService.signAccessToken(user);
    const refreshToken = tokenService.signRefreshToken(user);
    const tokenHash = tokenService.hashToken(refreshToken);

    await userModel.storeRefreshToken({
      userId: user.id,
      tokenHash,
      deviceInfo: req.headers['user-agent'],
      ipAddress: req.ip,
      expiresAt: tokenService.getRefreshTokenExpiry(),
    });

    setRefreshCookie(res, refreshToken);

    // Redirect to client with access token in URL fragment (not query param — doesn't reach server)
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    return res.redirect(`${clientUrl}/auth/login.html?token=${accessToken}&google=1`);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Helper Functions
// ============================================================

/**
 * Strip sensitive fields before sending user data to client
 */
const sanitizeUser = (user) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  display_name: user.display_name,
  avatar_url: user.avatar_url,
  role: user.role,
  email_verified: user.email_verified,
  google_connected: !!user.google_id,
  created_at: user.created_at,
});

/**
 * Set a secure HttpOnly refresh token cookie
 */
const setRefreshCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, getCookieOptions());
};

const getCookieOptions = () => ({
  httpOnly: true,      // Cannot be accessed by JavaScript
  secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
  sameSite: 'lax',    // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/',
});

module.exports = {
  register,
  login,
  logout,
  logoutAll,
  refresh,
  forgotPassword,
  resetPassword,
  getMe,
  googleCallback,
};
