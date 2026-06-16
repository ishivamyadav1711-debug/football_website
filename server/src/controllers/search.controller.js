const { fetchFromApiWithCache } = require('../services/api-football.service');
const logger = require('../utils/logger');

exports.searchAll = async (req, res, next) => {
  try {
    const query = (req.query.q || '').toLowerCase().trim();
    if (!query || query.length < 2) {
      return res.json({ success: true, data: { results: [] } });
    }

    const results = [];

    // Run parallel searches
    // API-Football endpoint /players/profiles is best for player text search. If it fails, fallback to /players
    const [teamsReq, playersReq, leaguesReq] = await Promise.all([
      fetchFromApiWithCache('/teams', { search: query }, 86400),
      fetchFromApiWithCache('/players/profiles', { search: query }, 86400),
      fetchFromApiWithCache('/leagues', { search: query }, 86400)
    ]);

    // Handle Teams
    if (teamsReq.response && Array.isArray(teamsReq.response)) {
      teamsReq.response.forEach(item => {
        if (item.team) {
          results.push({
            id: item.team.id,
            type: 'team',
            name: item.team.name,
            subtitle: item.team.country || 'Unknown',
            image: item.team.logo,
            url: `team.html?id=${item.team.id}`
          });
        }
      });
    }

    // Handle Players
    if (playersReq.response && Array.isArray(playersReq.response)) {
      playersReq.response.forEach(item => {
        if (item.player) {
          // Avoid duplicates by checking ID
          if (!results.find(r => r.id === item.player.id && r.type === 'player')) {
            results.push({
              id: item.player.id,
              type: 'player',
              name: item.player.name,
              subtitle: item.player.nationality || 'Unknown',
              image: item.player.photo || 'https://cdn.sportmonks.com/images/soccer/placeholder.png',
              url: `player.html?id=${item.player.id}`
            });
          }
        }
      });
    } else if (playersReq.errors && Object.keys(playersReq.errors).length > 0) {
      // If /players/profiles throws an error, maybe fallback to /players but that requires league/season.
      // So we just log it.
      logger.error('Error fetching players:', playersReq.errors);
    }

    // Handle Leagues
    if (leaguesReq.response && Array.isArray(leaguesReq.response)) {
      leaguesReq.response.forEach(item => {
        if (item.league) {
          results.push({
            id: item.league.id,
            type: 'league',
            name: item.league.name,
            subtitle: item.country ? item.country.name : 'Unknown',
            image: item.league.logo,
            url: `league.html?id=${item.league.id}`
          });
        }
      });
    }

    // Sort to prioritize exact matches
    results.sort((a, b) => {
      const aExact = a.name.toLowerCase() === query;
      const bExact = b.name.toLowerCase() === query;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });

    res.json({
      success: true,
      data: { results }
    });
  } catch (err) {
    logger.error('Error in searchAll:', err);
    next(err);
  }
};
