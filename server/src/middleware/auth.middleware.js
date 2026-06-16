const tokenService = require('../services/token.service');
const userModel = require('../models/user.model');

/**
 * Auth Middleware — JWT verification and role-based access control
 */

/**
 * verifyAccessToken
 * Extracts the JWT from the Authorization header, verifies it,
 * fetches fresh user data from DB, and attaches it to req.user
 *
 * Usage: router.get('/protected', verifyAccessToken, handler)
 */
const verifyAccessToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = tokenService.verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
          code: 'TOKEN_EXPIRED', // Client uses this to trigger silent refresh
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }

    // Fetch fresh user data (catches deleted users or role changes)
    const user = await userModel.findById(decoded.sub);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * requireRole
 * Role-based access control guard. Must be used AFTER verifyAccessToken.
 *
 * Role hierarchy: admin > moderator > user
 * Usage: router.delete('/admin/user/:id', verifyAccessToken, requireRole('admin'), handler)
 */
const ROLE_HIERARCHY = { user: 1, moderator: 2, admin: 3 };

const requireRole = (minRole) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
  const requiredLevel = ROLE_HIERARCHY[minRole] || 999;

  if (userLevel < requiredLevel) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Requires ${minRole} role or higher.`,
    });
  }

  next();
};

/**
 * optionalAuth
 * Attaches req.user if a valid token is present, but does NOT reject
 * the request if no token exists. Use for public routes that can
 * optionally personalize for logged-in users.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = tokenService.verifyAccessToken(token);
    req.user = await userModel.findById(decoded.sub);
  } catch {
    req.user = null;
  }
  next();
};

module.exports = { verifyAccessToken, requireRole, optionalAuth };
