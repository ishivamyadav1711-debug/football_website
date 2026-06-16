const express = require('express');
const passport = require('../config/passport');
const authController = require('../controllers/auth.controller');
const { verifyAccessToken } = require('../middleware/auth.middleware');
const { authRateLimiter, forgotPasswordRateLimiter } = require('../middleware/rateLimiter.middleware');
const { validate, registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('../utils/validators');

const router = express.Router();

// ============================================================
// Public Routes (no auth required)
// ============================================================

// Register
router.post('/register',
  authRateLimiter,
  validate(registerSchema),
  authController.register
);

// Login with email/password
router.post('/login',
  authRateLimiter,
  validate(loginSchema),
  authController.login
);

// Logout (clears cookie + revokes token)
router.post('/logout', authController.logout);

// Refresh access token using HttpOnly cookie refresh token
router.post('/refresh', authController.refresh);

// Forgot password — sends reset email
router.post('/forgot-password',
  forgotPasswordRateLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

// Reset password with token from email
router.post('/reset-password',
  validate(resetPasswordSchema),
  authController.resetPassword
);

// ============================================================
// Google OAuth Routes
// ============================================================

// Redirect to Google consent screen
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

// Handle Google callback
router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/auth/login.html?error=google_failed`,
  }),
  authController.googleCallback
);

// ============================================================
// Protected Routes (require valid access token)
// ============================================================

// Get current user profile
router.get('/me', verifyAccessToken, authController.getMe);

// Logout from all devices
router.post('/logout-all', verifyAccessToken, authController.logoutAll);

module.exports = router;
