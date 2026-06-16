const express = require('express');
const userController = require('../controllers/user.controller');
const { verifyAccessToken, requireRole } = require('../middleware/auth.middleware');
const { validate, updateProfileSchema, changePasswordSchema } = require('../utils/validators');

const router = express.Router();

// ============================================================
// Protected User Routes (auth required)
// ============================================================

// Get current user's active sessions
router.get('/sessions', verifyAccessToken, userController.getSessions);

// Revoke a specific session
router.delete('/sessions/:sessionId', verifyAccessToken, userController.revokeSession);

// Update profile (display name, avatar)
router.patch('/profile',
  verifyAccessToken,
  validate(updateProfileSchema),
  userController.updateProfile
);

// Change password (email accounts only)
router.post('/change-password',
  verifyAccessToken,
  validate(changePasswordSchema),
  userController.changePassword
);

// ============================================================
// Public Routes
// ============================================================

// Get public profile
router.get('/:id/public', userController.getPublicProfile);

// ============================================================
// Admin-Only Routes
// ============================================================

// List all users (admin only)
router.get('/', verifyAccessToken, requireRole('admin'), async (req, res, next) => {
  try {
    const { query } = require('../config/db');
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT id, email, username, display_name, role, email_verified, created_at 
       FROM users 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await query('SELECT COUNT(*) FROM users');
    const total = parseInt(countResult.rows[0].count);

    return res.json({
      success: true,
      data: {
        users: result.rows,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (err) {
    next(err);
  }
});

// Update user role (admin only)
router.patch('/:id/role', verifyAccessToken, requireRole('admin'), async (req, res, next) => {
  try {
    const { role } = req.body;
    const validRoles = ['user', 'moderator', 'admin'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const { query } = require('../config/db');
    const result = await query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, role',
      [role, req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, data: { user: result.rows[0] } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
