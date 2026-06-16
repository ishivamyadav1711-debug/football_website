const favoritesModel = require('../models/favorites.model');
const { TEAMS_DB } = require('./team.controller');
const { PLAYERS_DB } = require('./player.controller');
const { LEAGUES_DB } = require('./league.controller');

exports.addFavorite = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.body;
    const userId = req.user.id;

    if (!entityType || !entityId) {
      return res.status(400).json({ success: false, message: 'Missing entityType or entityId' });
    }

    await favoritesModel.addFavorite(userId, entityType, entityId);
    
    res.json({ success: true, message: 'Added to favorites' });
  } catch (err) {
    next(err);
  }
};

exports.removeFavorite = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.body;
    const userId = req.user.id;

    if (!entityType || !entityId) {
      return res.status(400).json({ success: false, message: 'Missing entityType or entityId' });
    }

    await favoritesModel.removeFavorite(userId, entityType, entityId);
    
    res.json({ success: true, message: 'Removed from favorites' });
  } catch (err) {
    next(err);
  }
};

exports.getFavorites = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const rawFavorites = await favoritesModel.getFavoritesByUser(userId);
    const apiKey = process.env.RAPIDAPI_KEY;

    // Hydrate the favorites
    const hydratedPromises = rawFavorites.map(async (fav) => {
      let data = null;
      let url = '#';
      
      if (fav.entity_type === 'team') {
        data = TEAMS_DB[fav.entity_id];
        url = `team.html?id=${fav.entity_id}`;
      } else if (fav.entity_type === 'league') {
        data = LEAGUES_DB[fav.entity_id];
        url = `league.html?id=${fav.entity_id}`;
      } else if (fav.entity_type === 'player') {
        data = PLAYERS_DB[fav.entity_id];
        url = `player.html?id=${fav.entity_id}`;
        
        // If not in local DB, attempt API fetch
        if (!data && apiKey && apiKey !== 'YOUR_API_KEY_HERE') {
          try {
            const response = await fetch(`https://v3.football.api-sports.io/players/profiles?player=${fav.entity_id}`, {
              headers: {
                'x-rapidapi-host': 'v3.football.api-sports.io',
                'x-rapidapi-key': apiKey
              }
            });
            const apiJson = await response.json();
            if (apiJson.response && apiJson.response[0]) {
              const p = apiJson.response[0].player;
              data = { name: p.name, image: p.photo };
              url = `player.html?id=${fav.entity_id}&api=true`;
            }
          } catch (e) {
            console.error('Failed to hydrate API player:', e);
          }
        }
      }

      if (!data) return null;

      return {
        type: fav.entity_type,
        id: fav.entity_id,
        name: data.name,
        image: data.logo_url || data.image,
        url: url,
        added_at: fav.created_at
      };
    });

    const resolved = await Promise.all(hydratedPromises);
    const hydrated = resolved.filter(item => item !== null);

    res.json({ success: true, data: { favorites: hydrated } });
  } catch (err) {
    next(err);
  }
};
