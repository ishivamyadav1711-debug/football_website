const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notifications.controller');
const { verifyAccessToken, requireRole } = require('../middleware/auth.middleware');

// All standard notification routes require auth
router.use(verifyAccessToken);

router.get('/', notificationsController.getNotifications);
router.put('/:notificationId/read', notificationsController.markAsRead);

// Admin route to trigger a mock notification for testing
// In a real app, this would be triggered by a webhook or cron job
router.post('/trigger', requireRole('admin'), notificationsController.triggerMockNotification);

module.exports = router;
