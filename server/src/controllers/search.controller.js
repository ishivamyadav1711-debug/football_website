const { TEAMS_DB } = require('./team.controller');
const { PLAYERS_DB } = require('./player.controller');
const { LEAGUES_DB } = require('./league.controller');

exports.searchAll = async (req, res, next) => {
  try {
    const query = (req.query.q || '').toLowerCase().trim();
    if (!query) {
      return res.json({ success: true, data: { results: [] } });
    }

    const results = [];

    // Search Teams
    Object.values(TEAMS_DB).forEach(team => {
      if (team.name.toLowerCase().includes(query) || team.short_name.toLowerCase().includes(query)) {
        results.push({
          id: team.id,
          type: 'team',
          name: team.name,
          subtitle: team.league,
          image: team.logo_url,
          url: `team.html?id=${team.id}`
        });
      }
    });

    // Search Players
    Object.values(PLAYERS_DB).forEach(player => {
      if (player.name.toLowerCase().includes(query)) {
        results.push({
          id: player.id,
          type: 'player',
          name: player.name,
          subtitle: `${player.position} • ${player.team_name}`,
          image: player.image,
          url: `player.html?id=${player.id}`
        });
      }
    });

    // Search Leagues
    Object.values(LEAGUES_DB).forEach(league => {
      if (league.name.toLowerCase().includes(query) || league.id.toLowerCase().includes(query)) {
        results.push({
          id: league.id,
          type: 'league',
          name: league.name,
          subtitle: league.country,
          image: league.logo_url,
          url: `league.html?id=${league.id}`
        });
      }
    });

    // API-Football Integration (if API key is present)
    const apiKey = process.env.RAPIDAPI_KEY;
    if (apiKey && apiKey !== 'YOUR_API_KEY_HERE') {
      try {
        const response = await fetch(`https://v3.football.api-sports.io/players/profiles?search=${encodeURIComponent(query)}`, {
          method: 'GET',
          headers: {
            'x-rapidapi-host': 'v3.football.api-sports.io',
            'x-rapidapi-key': apiKey
          }
        });
        const apiJson = await response.json();
        
        if (apiJson.response && Array.isArray(apiJson.response)) {
          apiJson.response.forEach(item => {
            if (item.player) {
              // Avoid duplicates with our mock DB (basic check)
              if (!results.find(r => r.name === item.player.name)) {
                results.push({
                  id: item.player.id, // we use the real API-Football ID
                  type: 'player',
                  name: item.player.name,
                  subtitle: item.player.nationality || 'Unknown',
                  image: item.player.photo || 'https://cdn.sportmonks.com/images/soccer/placeholder.png',
                  url: `player.html?id=${item.player.id}&api=true` // flag that it's an API ID
                });
              }
            }
          });
        }
      } catch (err) {
        console.error('API-Football search error:', err);
        // Silently fallback to mock results if API fails
      }
    }

    // Sort to prioritize exact matches or simply return
    res.json({
      success: true,
      data: { results }
    });
  } catch (err) {
    next(err);
  }
};
