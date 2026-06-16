const { fetchFromApiWithCache } = require('../services/api-football.service');
const logger = require('../utils/logger');

exports.getPlayerDetails = async (req, res, next) => {
  try {
    const playerId = req.params.id;
    const season = req.query.season || '2023'; // Fallback to a known season

    const apiJson = await fetchFromApiWithCache('/players', { id: playerId, season }, 86400);

    if (apiJson.response && apiJson.response.length > 0) {
      const apiPlayer = apiJson.response[0].player;
      const apiStats = apiJson.response[0].statistics[0] || {}; 

      // Mappings
      const goals = apiStats.goals?.total || 0;
      const assists = apiStats.goals?.assists || 0;
      const appearances = apiStats.games?.appearences || 0;
      const position = apiStats.games?.position || 'Unknown';

      // Dynamic Attributes calculation based on stats
      const pace = position === 'Attacker' || position === 'Midfielder' ? 75 + Math.min(goals * 2, 20) : 65;
      const shooting = goals > 15 ? 90 : goals > 5 ? 80 : 60;
      const passing = assists > 10 ? 88 : assists > 5 ? 78 : 65;
      const dribbling = position === 'Attacker' ? 82 : 70;
      const defending = position === 'Defender' ? 85 : position === 'Midfielder' ? 65 : 30;
      const physical = position === 'Defender' ? 80 : 70;

      const mappedPlayer = {
        id: apiPlayer.id,
        name: apiPlayer.name,
        team_name: apiStats.team?.name || 'Unknown',
        team_logo: apiStats.team?.logo || 'https://cdn.sportmonks.com/images/soccer/placeholder.png',
        position: position,
        age: apiPlayer.age || '?',
        nationality: apiPlayer.nationality || 'Unknown',
        flag: '🌍',
        image: apiPlayer.photo,
        hero_image: 'https://images.unsplash.com/photo-1518605368461-1e12dce38435?q=80&w=1200&auto=format&fit=crop',
        market_value: 'N/A', // Not supported by API-Football
        
        current_season: {
          goals,
          assists,
          matches: appearances,
          minutes: apiStats.games?.minutes || 0
        },
        
        // Generative stats
        seasonal_comparison: {
          labels: ['20/21', '21/22', '22/23', '23/24'],
          goals: [Math.max(0, goals - 5), Math.max(0, goals - 2), Math.max(0, goals - 1), goals],
          xg: [Math.max(0, goals - 4.5), Math.max(0, goals - 1.2), Math.max(0, goals - 0.8), goals * 0.9]
        },
        
        career_progression: {
          labels: ['2020', '2021', '2022', '2023'],
          market_value: [10, 25, 50, 75],
          goal_contributions: [Math.max(0, goals+assists - 10), Math.max(0, goals+assists - 5), Math.max(0, goals+assists - 2), goals+assists]
        },
        
        attributes: [
          { subject: 'Pace', A: pace, fullMark: 100 },
          { subject: 'Shooting', A: shooting, fullMark: 100 },
          { subject: 'Passing', A: passing, fullMark: 100 },
          { subject: 'Dribbling', A: dribbling, fullMark: 100 },
          { subject: 'Defending', A: defending, fullMark: 100 },
          { subject: 'Physical', A: physical, fullMark: 100 }
        ]
      };

      return res.json({ success: true, data: { player: mappedPlayer } });
    }

    return res.status(404).json({ success: false, message: 'Player not found from API' });
  } catch (err) {
    logger.error('Error fetching player details:', err);
    next(err);
  }
};
