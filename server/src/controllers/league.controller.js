const { fetchFromApiWithCache } = require('../services/api-football.service');
const logger = require('../utils/logger');

// Mapping popular league codes to API-Football IDs
const LEAGUE_MAP = {
  'PL': 39,
  'PD': 140, // La Liga
  'SA': 135, // Serie A
  'BL1': 78, // Bundesliga
  'FL1': 61, // Ligue 1
  'CL': 2,   // Champions League
};

exports.getLeagueDetails = async (req, res, next) => {
  try {
    const leagueCode = req.params.id || 'PL';
    // Use 2023 season as fallback since 2025/26 doesn't exist yet in real API data usually without current active season
    const season = req.query.season ? req.query.season.substring(0, 4) : '2023'; 
    
    const apiLeagueId = LEAGUE_MAP[leagueCode] || 39;

    // Fetch in parallel
    const [standingsReq, scorersReq, assistsReq, fixturesReq] = await Promise.all([
      fetchFromApiWithCache('/standings', { league: apiLeagueId, season }, 7200),
      fetchFromApiWithCache('/players/topscorers', { league: apiLeagueId, season }, 86400),
      fetchFromApiWithCache('/players/topassists', { league: apiLeagueId, season }, 86400),
      fetchFromApiWithCache('/fixtures', { league: apiLeagueId, season, next: 15 }, 7200)
    ]);

    // Handle Standings
    let standings = [];
    let leagueInfo = { name: leagueCode, country: 'Unknown', logo_url: '' };
    
    if (standingsReq.response && standingsReq.response.length > 0) {
      const leagueData = standingsReq.response[0].league;
      leagueInfo = {
        id: leagueCode,
        name: leagueData.name,
        country: leagueData.country,
        logo_url: leagueData.logo,
        banner_url: 'https://images.unsplash.com/photo-1518605368461-1e12dce38435?q=80&w=2000&auto=format&fit=crop'
      };
      
      standings = leagueData.standings[0].map(row => ({
        pos: row.rank,
        team: row.team.name,
        crest: row.team.logo,
        pld: row.all.played,
        w: row.all.win,
        d: row.all.draw,
        l: row.all.lose,
        gf: row.all.goals.for,
        ga: row.all.goals.against,
        gd: row.goalsDiff,
        pts: row.points,
        form: row.form ? row.form.split('') : []
      }));
    }

    // Handle Top Scorers
    let top_scorers = [];
    if (scorersReq.response) {
      top_scorers = scorersReq.response.slice(0, 5).map((item, index) => ({
        rank: index + 1,
        player: item.player.name,
        team: item.statistics[0].team.name,
        crest: item.statistics[0].team.logo,
        goals: item.statistics[0].goals.total,
        matches: item.statistics[0].games.appearences,
        photo: item.player.photo
      }));
    }

    // Handle Top Assists
    let top_assists = [];
    if (assistsReq.response) {
      top_assists = assistsReq.response.slice(0, 5).map((item, index) => ({
        rank: index + 1,
        player: item.player.name,
        team: item.statistics[0].team.name,
        crest: item.statistics[0].team.logo,
        assists: item.statistics[0].goals.assists,
        matches: item.statistics[0].games.appearences,
        photo: item.player.photo
      }));
    }

    let fixtures = [];
    if (fixturesReq.response) {
      fixtures = fixturesReq.response.map(f => ({
        id: f.fixture.id,
        date: new Date(f.fixture.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
        time: new Date(f.fixture.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
        home: { name: f.teams.home.name, crest: f.teams.home.logo },
        away: { name: f.teams.away.name, crest: f.teams.away.logo },
        league: leagueInfo.name
      }));
    }
    const results = [];

    res.json({
      success: true,
      data: {
        ...leagueInfo,
        season,
        standings,
        top_scorers,
        top_assists,
        fixtures,
        results
      }
    });
  } catch (err) {
    logger.error('Error in getLeagueDetails:', err);
    next(err);
  }
};
