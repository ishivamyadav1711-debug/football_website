const { fetchFromApiWithCache } = require('../services/api-football.service');
const logger = require('../utils/logger');

exports.getLiveMatches = async (req, res, next) => {
  try {
    const apiJson = await fetchFromApiWithCache('/fixtures', { live: 'all' }, 60);

    let matches = [];
    if (apiJson.response) {
      matches = apiJson.response.map(f => ({
        id: f.fixture.id,
        league: f.league.name,
        league_code: f.league.logo,
        home_team: { name: f.teams.home.name, short_name: f.teams.home.name.substring(0,3).toUpperCase(), crest: f.teams.home.logo },
        away_team: { name: f.teams.away.name, short_name: f.teams.away.name.substring(0,3).toUpperCase(), crest: f.teams.away.logo },
        home_score: f.goals.home || 0,
        away_score: f.goals.away || 0,
        minute: f.fixture.status.elapsed,
        status: f.fixture.status.short === 'HT' ? 'halftime' : 'live',
        events: [],
        stats: {
          possession: { home: 50, away: 50 },
          shots: { home: 0, away: 0 },
          shots_on_target: { home: 0, away: 0 },
          pass_accuracy: { home: 0, away: 0 },
          corners: { home: 0, away: 0 },
          fouls: { home: 0, away: 0 }
        },
        form: { home: [], away: [] }
      }));
    }

    res.json({ success: true, data: { matches } });
  } catch (err) {
    logger.error('Error fetching live matches:', err);
    next(err);
  }
};

exports.getMatchDetails = async (req, res, next) => {
  try {
    const matchId = req.params.id;
    const [fixtureReq, eventsReq, statsReq] = await Promise.all([
      fetchFromApiWithCache('/fixtures', { id: matchId }, 300),
      fetchFromApiWithCache('/fixtures/events', { fixture: matchId }, 60),
      fetchFromApiWithCache('/fixtures/statistics', { fixture: matchId }, 60)
    ]);

    if (!fixtureReq.response || fixtureReq.response.length === 0) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    const f = fixtureReq.response[0];
    
    // Process Events
    let events = [];
    if (eventsReq.response) {
      events = eventsReq.response.map((e, index) => ({
        id: index + 1,
        minute: e.time.elapsed,
        type: e.type.toLowerCase(), // 'goal', 'card', 'subst'
        team: e.team.id === f.teams.home.id ? 'home' : 'away',
        player: e.player.name,
        assist: e.assist?.name || null
      }));
    }

    // Process Stats
    const statsObj = { possession: { home: 50, away: 50 }, shots: { home: 0, away: 0 }, shots_on_target: { home: 0, away: 0 }, pass_accuracy: { home: 0, away: 0 }, corners: { home: 0, away: 0 }, fouls: { home: 0, away: 0 } };
    if (statsReq.response && statsReq.response.length === 2) {
      const homeStats = statsReq.response[0].statistics;
      const awayStats = statsReq.response[1].statistics;
      
      const getStat = (arr, type) => {
        const item = arr.find(s => s.type === type);
        if (!item || !item.value) return 0;
        if (typeof item.value === 'string' && item.value.includes('%')) return parseInt(item.value);
        return parseInt(item.value);
      };

      statsObj.possession = { home: getStat(homeStats, 'Ball Possession'), away: getStat(awayStats, 'Ball Possession') };
      statsObj.shots = { home: getStat(homeStats, 'Total Shots'), away: getStat(awayStats, 'Total Shots') };
      statsObj.shots_on_target = { home: getStat(homeStats, 'Shots on Goal'), away: getStat(awayStats, 'Shots on Goal') };
      statsObj.pass_accuracy = { home: getStat(homeStats, 'Passes %'), away: getStat(awayStats, 'Passes %') };
      statsObj.corners = { home: getStat(homeStats, 'Corner Kicks'), away: getStat(awayStats, 'Corner Kicks') };
      statsObj.fouls = { home: getStat(homeStats, 'Fouls'), away: getStat(awayStats, 'Fouls') };
    }

    const match = {
      id: f.fixture.id,
      league: f.league.name,
      league_code: f.league.logo,
      home_team: { name: f.teams.home.name, short_name: f.teams.home.name.substring(0,3).toUpperCase(), crest: f.teams.home.logo },
      away_team: { name: f.teams.away.name, short_name: f.teams.away.name.substring(0,3).toUpperCase(), crest: f.teams.away.logo },
      home_score: f.goals.home,
      away_score: f.goals.away,
      minute: f.fixture.status.elapsed,
      status: f.fixture.status.short === 'FT' ? 'finished' : f.fixture.status.short === 'HT' ? 'halftime' : 'live',
      events,
      stats: statsObj,
      form: { home: [], away: [] }
    };

    res.json({ success: true, data: { match } });
  } catch (err) {
    logger.error('Error fetching match details:', err);
    next(err);
  }
};
