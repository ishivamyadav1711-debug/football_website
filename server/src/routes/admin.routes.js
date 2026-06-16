const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyAccessToken, requireRole } = require('../middleware/auth.middleware');

// EVERY route in this file requires authentication and ADMIN role
router.use(verifyAccessToken);
router.use(requireRole('admin'));

// Analytics
router.get('/stats', adminController.getDashboardStats);

// User Management
router.get('/users', adminController.getUsers);
router.put('/users/:userId/role', adminController.updateUserRole);

module.exports = router;
