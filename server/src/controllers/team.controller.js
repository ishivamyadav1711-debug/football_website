const { fetchFromApiWithCache } = require('../services/api-football.service');
const logger = require('../utils/logger');

exports.getTeamDetails = async (req, res, next) => {
  try {
    const teamId = req.params.id;
    const season = req.query.season || '2023';

    // Fetch team info, squad, past fixtures (results), coach, and upcoming fixtures
    const [teamReq, squadReq, pastFixturesReq, coachReq, upcomingFixturesReq] = await Promise.all([
      fetchFromApiWithCache('/teams', { id: teamId }, 86400),
      fetchFromApiWithCache('/players/squads', { team: teamId }, 86400),
      fetchFromApiWithCache('/fixtures', { team: teamId, season, last: 5 }, 7200),
      fetchFromApiWithCache('/coachs', { team: teamId }, 86400),
      fetchFromApiWithCache('/fixtures', { team: teamId, next: 5 }, 7200)
    ]);

    if (!teamReq.response || teamReq.response.length === 0) {
      return res.status(404).json({ success: false, message: 'Team not found from API' });
    }

    const apiTeam = teamReq.response[0].team;
    const apiVenue = teamReq.response[0].venue;
    
    // Find manager
    let manager = 'Unknown';
    if (coachReq.response && coachReq.response.length > 0) {
      manager = coachReq.response[0].name;
    }

    let squad = [];
    if (squadReq.response && squadReq.response.length > 0) {
      squad = squadReq.response[0].players.map(p => ({
        id: p.id,
        name: p.name,
        position: p.position,
        age: p.age,
        nationality: '🌍',
        image: p.photo,
        rating: (Math.random() * 2 + 7).toFixed(1)
      }));
    }

    let results = [];
    let leagueId = null; // Will extract from a recent fixture to query stats
    if (pastFixturesReq.response && pastFixturesReq.response.length > 0) {
      leagueId = pastFixturesReq.response[0].league.id;
      results = pastFixturesReq.response.map(f => {
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

    let fixtures = [];
    if (upcomingFixturesReq.response && upcomingFixturesReq.response.length > 0) {
      fixtures = upcomingFixturesReq.response.map(f => {
        const isHome = f.teams.home.id === parseInt(teamId);
        return {
          date: new Date(f.fixture.date).toLocaleDateString(),
          opponent: isHome ? f.teams.away.name : f.teams.home.name,
          venue: isHome ? 'Home' : 'Away',
          competition: f.league.name
        };
      });
    }

    // Fetch Stats if we found a league
    let stats = {
      played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, clean_sheets: 0, yellow_cards: 0, red_cards: 0
    };
    if (leagueId) {
      try {
        const statsReq = await fetchFromApiWithCache('/teams/statistics', { league: leagueId, season, team: teamId }, 86400);
        if (statsReq.response && statsReq.response.fixtures) {
          const s = statsReq.response;
          stats = {
            played: s.fixtures.played.total,
            won: s.fixtures.wins.total,
            drawn: s.fixtures.draws.total,
            lost: s.fixtures.loses.total,
            goals_for: s.goals.for.total.total,
            goals_against: s.goals.against.total.total,
            clean_sheets: s.clean_sheet.total,
            yellow_cards: Object.values(s.cards.yellow || {}).reduce((acc, curr) => acc + (curr.total || 0), 0),
            red_cards: Object.values(s.cards.red || {}).reduce((acc, curr) => acc + (curr.total || 0), 0)
          };
        }
      } catch (err) {
        logger.error('Error fetching team statistics:', err);
      }
    }

    const team = {
      id: apiTeam.id,
      name: apiTeam.name,
      short_name: apiTeam.code,
      league: pastFixturesReq.response && pastFixturesReq.response.length > 0 ? pastFixturesReq.response[0].league.name : 'Unknown',
      country: apiTeam.country,
      founded: apiTeam.founded,
      stadium: apiVenue.name,
      capacity: apiVenue.capacity ? apiVenue.capacity.toLocaleString() : 'N/A',
      manager: manager,
      logo_url: apiTeam.logo,
      banner_url: apiVenue.image || 'https://images.unsplash.com/photo-1518605368461-1e12dce38435?q=80&w=2000&auto=format&fit=crop',
      overview: `${apiTeam.name} is a professional football club based in ${apiVenue.city}, ${apiTeam.country}. Founded in ${apiTeam.founded}, they play their home matches at ${apiVenue.name}.`,
      stats,
      squad,
      fixtures,
      results
    };

    res.json({ success: true, data: { team } });
  } catch (err) {
    logger.error('Error fetching team details:', err);
    next(err);
  }
};
