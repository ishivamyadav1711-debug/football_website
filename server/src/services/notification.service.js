const db = require('../config/db');
const socketService = require('./socket.service');

/**
 * Creates a notification in the DB and emits it to the user via Socket.IO
 */
const notifyUser = async (userId, type, title, message, link = null) => {
  try {
    // 1. Save to database
    const insertQuery = `
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await db.query(insertQuery, [userId, type, title, message, link]);
    const notification = result.rows[0];

    // 2. Emit via Socket.io
    const io = socketService.getIO();
    io.to(`user_${userId}`).emit('notification', notification);

    return notification;
  } catch (err) {
    console.error('Failed to notify user:', err);
  }
};

/**
 * Fan-out notification based on entity favorites.
 * e.g., if entityType='team' and entityId='PL', anyone who favorited PL gets this.
 */
const notifyFollowers = async (entityType, entityId, type, title, message, link = null) => {
  try {
    // Find all users who follow this entity
    const followersQuery = `SELECT user_id FROM user_favorites WHERE entity_type = $1 AND entity_id = $2`;
    const followersResult = await db.query(followersQuery, [entityType, entityId]);
    
    // Send notification to each follower
    const promises = followersResult.rows.map(row => 
      notifyUser(row.user_id, type, title, message, link)
    );
    
    await Promise.all(promises);
    console.log(`Pushed notification to ${followersResult.rows.length} followers of ${entityType}:${entityId}`);
  } catch (err) {
    console.error('Failed to notify followers:', err);
  }
};

module.exports = {
  notifyUser,
  notifyFollowers
};
