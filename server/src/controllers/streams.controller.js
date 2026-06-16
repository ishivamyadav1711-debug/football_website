const db = require('../config/db');

exports.getStreamsByMatchId = async (req, res, next) => {
  try {
    const { matchId } = req.params;

    const query = `
      SELECT id, source_name, url, language, created_at 
      FROM match_streams 
      WHERE match_id = $1 AND is_active = TRUE
      ORDER BY created_at DESC
    `;
    const result = await db.query(query, [matchId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    next(err);
  }
};

exports.addStream = async (req, res, next) => {
  try {
    const { matchId, sourceName, url, language } = req.body;

    if (!matchId || !sourceName || !url) {
      return res.status(400).json({ success: false, message: 'matchId, sourceName, and url are required' });
    }

    const query = `
      INSERT INTO match_streams (match_id, source_name, url, language)
      VALUES ($1, $2, $3, $4)
      RETURNING id, source_name, url
    `;
    const values = [matchId, sourceName, url, language || 'EN'];
    
    const result = await db.query(query, values);

    res.status(201).json({
      success: true,
      message: 'Stream link added successfully',
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
};
