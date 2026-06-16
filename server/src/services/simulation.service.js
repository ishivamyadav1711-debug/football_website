const { getIO } = require('./socket.service');

// Simulated active matches
const activeMatches = [
  {
    id: 101,
    league: 'Premier League',
    league_code: 'epl',
    home_team: { name: 'Arsenal', short_name: 'ARS', crest: 'arsenal.svg' },
    away_team: { name: 'Chelsea', short_name: 'CHE', crest: 'chelsea.svg' },
    home_score: 2,
    away_score: 1,
    minute: 74,
    status: 'live',
    events: [
      { id: 1, minute: 12, type: 'goal', team: 'home', player: 'Saka', assist: 'Odegaard' },
      { id: 2, minute: 34, type: 'yellow_card', team: 'away', player: 'Enzo' },
      { id: 3, minute: 45, type: 'goal', team: 'away', player: 'Jackson', assist: 'Palmer' },
      { id: 4, minute: 68, type: 'goal', team: 'home', player: 'Martinelli', assist: 'Rice' },
    ],
    stats: {
      possession: { home: 58, away: 42 },
      shots: { home: 14, away: 8 },
      shots_on_target: { home: 6, away: 3 },
      pass_accuracy: { home: 88, away: 81 },
      corners: { home: 7, away: 4 },
      fouls: { home: 9, away: 12 }
    },
    form: {
      home: ['W', 'D', 'W', 'W', 'L'],
      away: ['L', 'D', 'W', 'L', 'W']
    }
  },
  {
    id: 102,
    league: 'Champions League',
    league_code: 'ucl',
    home_team: { name: 'Real Madrid', short_name: 'RMA', crest: 'real.svg' },
    away_team: { name: 'Barcelona', short_name: 'BAR', crest: 'barca.svg' },
    home_score: 1,
    away_score: 1,
    minute: 45,
    status: 'halftime',
    events: [
      { id: 5, minute: 22, type: 'goal', team: 'home', player: 'Vinicius Jr', assist: 'Bellingham' },
      { id: 6, minute: 42, type: 'goal', team: 'away', player: 'Lewandowski', assist: 'Yamal' },
      { id: 7, minute: 44, type: 'red_card', team: 'away', player: 'Gavi' }
    ],
    stats: {
      possession: { home: 45, away: 55 },
      shots: { home: 9, away: 11 },
      shots_on_target: { home: 4, away: 5 },
      pass_accuracy: { home: 86, away: 89 },
      corners: { home: 3, away: 5 },
      fouls: { home: 6, away: 8 }
    },
    form: {
      home: ['W', 'W', 'W', 'D', 'W'],
      away: ['W', 'W', 'D', 'W', 'L']
    }
  }
];

let eventIdCounter = 10;

/**
 * Get all active matches
 */
const getLiveMatches = () => activeMatches;

/**
 * Get a specific match by ID
 */
const getMatchById = (id) => activeMatches.find(m => m.id === parseInt(id));

/**
 * Start the simulation loop
 */
const startSimulation = () => {
  setInterval(() => {
    let io;
    try {
      io = getIO();
    } catch (err) {
      return; // Socket not initialized yet
    }

    activeMatches.forEach(match => {
      // Only simulate 'live' matches
      if (match.status !== 'live') {
        if (match.status === 'halftime' && Math.random() < 0.2) {
          match.status = 'live';
          match.minute = 46;
          io.to('live_scores').emit('match_status_change', { matchId: match.id, status: 'live', minute: match.minute });
          io.to(`match_${match.id}`).emit('match_status_change', { matchId: match.id, status: 'live', minute: match.minute });
        }
        return;
      }

      // Tick minute
      if (Math.random() < 0.5) {
        match.minute += 1;
        io.to('live_scores').emit('minute_tick', { matchId: match.id, minute: match.minute });
        io.to(`match_${match.id}`).emit('minute_tick', { matchId: match.id, minute: match.minute });
      }

      // 2% chance of a goal per tick
      if (Math.random() < 0.02) {
        const isHome = Math.random() > 0.5;
        const team = isHome ? 'home' : 'away';
        if (isHome) match.home_score++; else match.away_score++;

        const players = isHome ? ['Saka', 'Odegaard', 'Martinelli', 'Rice', 'Havertz'] : ['Palmer', 'Jackson', 'Sterling', 'Enzo', 'Gallagher'];
        const scorer = players[Math.floor(Math.random() * players.length)];

        const newEvent = {
          id: eventIdCounter++,
          minute: match.minute,
          type: 'goal',
          team: team,
          player: scorer
        };

        match.events.push(newEvent);

        const payload = {
          matchId: match.id,
          home_score: match.home_score,
          away_score: match.away_score,
          event: newEvent
        };

        io.to('live_scores').emit('score_update', payload);
        io.to(`match_${match.id}`).emit('score_update', payload);
        console.log(`⚽ GOAL in match ${match.id}: ${match.home_score} - ${match.away_score}`);
      }

      // 5% chance of a yellow card
      if (Math.random() < 0.05) {
        const isHome = Math.random() > 0.5;
        const team = isHome ? 'home' : 'away';
        const newEvent = {
          id: eventIdCounter++,
          minute: match.minute,
          type: 'yellow_card',
          team: team,
          player: 'Player ' + Math.floor(Math.random() * 99)
        };
        match.events.push(newEvent);
        
        io.to('live_scores').emit('match_event', { matchId: match.id, event: newEvent });
        io.to(`match_${match.id}`).emit('match_event', { matchId: match.id, event: newEvent });
      }

      // Minor stats fluctuation
      if (Math.random() < 0.3) {
        match.stats.shots.home += Math.random() > 0.7 ? 1 : 0;
        match.stats.possession.home = Math.max(30, Math.min(70, match.stats.possession.home + (Math.random() > 0.5 ? 1 : -1)));
        match.stats.possession.away = 100 - match.stats.possession.home;
        
        io.to(`match_${match.id}`).emit('stats_update', { matchId: match.id, stats: match.stats });
      }

      // End match at 90+
      if (match.minute >= 93) {
        match.status = 'finished';
        io.to('live_scores').emit('match_status_change', { matchId: match.id, status: 'finished' });
        io.to(`match_${match.id}`).emit('match_status_change', { matchId: match.id, status: 'finished' });
      }
    });
  }, 3000); // Ticks every 3 seconds for demonstration
};

module.exports = {
  getLiveMatches,
  getMatchById,
  startSimulation
};
