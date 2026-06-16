const db = require('../config/db');

exports.getMatchHistory = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    
    // Fetch last 50 messages for this match
    const query = `
      SELECT m.id, m.content, m.created_at, u.display_name, u.username, u.avatar_url
      FROM match_messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.match_id = $1
      ORDER BY m.created_at DESC
      LIMIT 50
    `;
    const result = await db.query(query, [matchId]);

    // Reverse to chronological order for chat UI
    const messages = result.rows.reverse();

    res.json({
      success: true,
      data: messages
    });
  } catch (err) {
    next(err);
  }
};
