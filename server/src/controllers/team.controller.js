const { fetchFromApiWithCache } = require('../services/api-football.service');
const logger = require('../utils/logger');

exports.getTeamDetails = async (req, res, next) => {
  try {
    const teamId = req.params.id;
    const season = req.query.season || '2023';

    // Fetch team info, squad, and last 5 fixtures for form/results
    const [teamReq, squadReq, fixturesReq] = await Promise.all([
      fetchFromApiWithCache('/teams', { id: teamId }, 86400),
      fetchFromApiWithCache('/players/squads', { team: teamId }, 86400),
      fetchFromApiWithCache('/fixtures', { team: teamId, season, last: 5 }, 7200)
    ]);

    if (!teamReq.response || teamReq.response.length === 0) {
      return res.status(404).json({ success: false, message: 'Team not found from API' });
    }

    const apiTeam = teamReq.response[0].team;
    const apiVenue = teamReq.response[0].venue;
    
    let squad = [];
    if (squadReq.response && squadReq.response.length > 0) {
      squad = squadReq.response[0].players.map(p => ({
        id: p.id,
        name: p.name,
        position: p.position,
        age: p.age,
        nationality: '🌍', // Add emoji mapping if needed later
        image: p.photo,
        rating: (Math.random() * 2 + 7).toFixed(1) // Keep a mock rating for UI since API doesn't provide rating
      }));
    }

    let results = [];
    if (fixturesReq.response) {
      results = fixturesReq.response.map(f => {
        const isHome = f.teams.home.id === parseInt(teamId);
        const homeScore = f.goals.home;
        const awayScore = f.goals.away;
        let resultChar = 'D';
        if (isHome && homeScore > awayScore) resultChar = 'W';
        if (isHome && homeScore < awayScore) resultChar = 'L';
        if (!isHome && awayScore > homeScore) resultChar = 'W';
        if (!isHome && awayScore < homeScore) resultChar = 'L';
        
        return {
          date: new Date(f.fixture.date).toLocaleDateString(),
          opponent: isHome ? f.teams.away.name : f.teams.home.name,
          venue: isHome ? 'Home' : 'Away',
          competition: f.league.name,
          result: `${resultChar} ${homeScore}-${awayScore}`
        };
      });
    }

    const team = {
      id: apiTeam.id,
      name: apiTeam.name,
      short_name: apiTeam.code,
      league: 'Unknown',
      country: apiTeam.country,
      founded: apiTeam.founded,
      stadium: apiVenue.name,
      capacity: apiVenue.capacity.toLocaleString(),
      manager: 'Unknown', // Need separate API call for coach, keeping simple for now
      logo_url: apiTeam.logo,
      banner_url: apiVenue.image || 'https://images.unsplash.com/photo-1518605368461-1e12dce38435?q=80&w=2000&auto=format&fit=crop',
      overview: `${apiTeam.name} is a professional football club based in ${apiVenue.city}, ${apiTeam.country}.`,
      stats: {
        played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, clean_sheets: 0, yellow_cards: 0, red_cards: 0
      },
      squad,
      fixtures: [], // Could fetch next 5 fixtures if needed
      results,
      transfers: [] // API-Football provides transfers via another endpoint
    };

    res.json({ success: true, data: { team } });
  } catch (err) {
    logger.error('Error fetching team details:', err);
    next(err);
  }
};
