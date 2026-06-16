const { query } = require('../config/db');

const addFavorite = async (userId, entityType, entityId) => {
  const res = await query(
    `INSERT INTO user_favorites (user_id, entity_type, entity_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, entity_type, entity_id) DO NOTHING
     RETURNING *`,
    [userId, entityType, entityId]
  );
  return res.rows[0];
};

const removeFavorite = async (userId, entityType, entityId) => {
  const res = await query(
    `DELETE FROM user_favorites
     WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3
     RETURNING *`,
    [userId, entityType, entityId]
  );
  return res.rows[0];
};

const getFavoritesByUser = async (userId) => {
  const res = await query(
    `SELECT entity_type, entity_id, created_at
     FROM user_favorites
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return res.rows;
};

module.exports = {
  addFavorite,
  removeFavorite,
  getFavoritesByUser
};
