const db = require('../config/db');

exports.getDashboardStats = async (req, res, next) => {
  try {
    // Active Users (total users in DB)
    const usersResult = await db.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(usersResult.rows[0].count, 10);


    // Popular Teams/Players (from user_favorites)
    const popularEntitiesQuery = `
      SELECT entity_type, entity_id, COUNT(*) as followers
      FROM user_favorites
      GROUP BY entity_type, entity_id
      ORDER BY followers DESC
      LIMIT 10
    `;
    const popularEntitiesResult = await db.query(popularEntitiesQuery);

    // Mock API requests
    const apiRequests = 1240;
    
    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active_today: Math.floor(totalUsers * 0.15)
        },
        metrics: {
          revenue: apiRequests, // Now represents API Requests
          conversion_rate: 85 // Now represents Push Notifications Sent
        },
        popular: popularEntitiesResult.rows
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const query = `
      SELECT id, username, email, role, created_at, email_verified 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 50
    `;
    const result = await db.query(query);

    res.json({
      success: true,
      data: {
        users: result.rows
      }
    });
  } catch (err) {
    next(err);
  }
};

// Admin action to change a user's role
exports.updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    await db.query(`UPDATE users SET role = $1 WHERE id = $2`, [role, userId]);

    res.json({ success: true, message: 'User role updated successfully' });
  } catch (err) {
    next(err);
  }
};
