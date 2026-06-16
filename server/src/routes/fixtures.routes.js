const express = require('express');
const router = express.Router();
const { fetchFromApiWithCache } = require('../services/api-football.service');

// Get Upcoming Fixtures
router.get('/', async (req, res, next) => {
  try {
    const { date, league, next: nextMatches, season } = req.query;
    
    const params = {};
    if (date) params.date = date;
    if (league) params.league = league;
    if (season) params.season = season;
    if (nextMatches) params.next = nextMatches;
    else if (!date) params.next = 15; // Default to next 15 matches globally if no date

    // Cache for 5 minutes (300s)
    const data = await fetchFromApiWithCache('/fixtures', params, 300);
    
    if (!data.response) {
      return res.json({ success: true, data: { fixtures: [] } });
    }

    const transformedFixtures = data.response.map((match) => {
      // Grouping by Date string like 'Today', 'Tomorrow', 'Thu' helps frontend
      const matchDate = new Date(match.fixture.date);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      let dateLabel = matchDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      if (matchDate.toDateString() === today.toDateString()) {
        dateLabel = 'Today';
      } else if (matchDate.toDateString() === tomorrow.toDateString()) {
        dateLabel = 'Tomorrow';
      }

      return {
        id: match.fixture.id,
        date: dateLabel,
        time: matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        league: match.league.name,
        home: {
          name: match.teams.home.name,
          crest: match.teams.home.logo || 'https://cdn.sportmonks.com/images/soccer/placeholder.png',
        },
        away: {
          name: match.teams.away.name,
          crest: match.teams.away.logo || 'https://cdn.sportmonks.com/images/soccer/placeholder.png',
        }
      };
    });

    res.json({ success: true, data: { fixtures: transformedFixtures } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
