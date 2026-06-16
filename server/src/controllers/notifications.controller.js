const db = require('../config/db');
const notificationService = require('../services/notification.service');

exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    const query = `
      SELECT * FROM notifications 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    const result = await db.query(query, [userId, limit]);
    
    // Also get unread count
    const countQuery = `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE`;
    const countResult = await db.query(countQuery, [userId]);

    res.json({
      success: true,
      data: {
        notifications: result.rows,
        unread_count: parseInt(countResult.rows[0].count, 10)
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    if (notificationId === 'all') {
      await db.query(`UPDATE notifications SET is_read = TRUE WHERE user_id = $1`, [userId]);
    } else {
      await db.query(`UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND id = $2`, [userId, notificationId]);
    }

    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

// Admin/Test endpoint to trigger a mock notification
exports.triggerMockNotification = async (req, res, next) => {
  try {
    const { entityType, entityId, type, title, message, link } = req.body;
    
    if (!entityType || !entityId || !type || !title || !message) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // This will notify all users who favorited this entity
    await notificationService.notifyFollowers(entityType, entityId, type, title, message, link);

    res.json({ success: true, message: 'Mock notification dispatched' });
  } catch (err) {
    next(err);
  }
};
