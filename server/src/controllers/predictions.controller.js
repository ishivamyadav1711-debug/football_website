const db = require('../config/db');

// Mock AI Prediction Engine
const generatePrediction = (matchId) => {
  // Deterministic mock generation based on matchId
  const hash = matchId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Base probabilities
  let homeWin = 30 + (hash % 40); // 30-70
  let awayWin = 10 + (hash % 30); // 10-40
  let draw = 100 - homeWin - awayWin;
  
  if (draw < 5) {
    draw = 15;
    homeWin -= 5;
    awayWin -= 5;
  }

  const forms = [
    ['W', 'W', 'W', 'D', 'W'],
    ['L', 'W', 'D', 'L', 'L'],
    ['W', 'D', 'D', 'W', 'W'],
    ['L', 'L', 'L', 'D', 'L'],
    ['W', 'W', 'L', 'W', 'W']
  ];

  return {
    match_id: matchId,
    home_win_prob: homeWin,
    draw_prob: draw,
    away_win_prob: awayWin,
    confidence: 65 + (hash % 30), // 65-95%
    home_form: forms[hash % 5],
    away_form: forms[(hash + 2) % 5],
    key_players: [
      { name: 'Erling Haaland', team: 'home', role: 'Striker' },
      { name: 'Bukayo Saka', team: 'away', role: 'Winger' }
    ],
    h2h: { home_wins: (hash % 5), draws: (hash % 3), away_wins: (hash % 4) }
  };
};

exports.getPrediction = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    
    // Generate AI Prediction
    const prediction = generatePrediction(matchId);

    // Fetch Community Votes
    const votesQuery = `
      SELECT vote, COUNT(*) as count 
      FROM prediction_votes 
      WHERE match_id = $1 
      GROUP BY vote
    `;
    const votesResult = await db.query(votesQuery, [matchId]);
    
    let totalVotes = 0;
    const voteCounts = { home: 0, draw: 0, away: 0 };
    
    votesResult.rows.forEach(row => {
      const count = parseInt(row.count, 10);
      voteCounts[row.vote] = count;
      totalVotes += count;
    });

    const community_votes = {
      total: totalVotes,
      home_pct: totalVotes > 0 ? Math.round((voteCounts.home / totalVotes) * 100) : 0,
      draw_pct: totalVotes > 0 ? Math.round((voteCounts.draw / totalVotes) * 100) : 0,
      away_pct: totalVotes > 0 ? Math.round((voteCounts.away / totalVotes) * 100) : 0
    };

    // If user is authenticated, check their vote
    let userVote = null;
    if (req.user) {
      const userVoteQuery = `SELECT vote FROM prediction_votes WHERE user_id = $1 AND match_id = $2`;
      const userVoteResult = await db.query(userVoteQuery, [req.user.id, matchId]);
      if (userVoteResult.rows.length > 0) {
        userVote = userVoteResult.rows[0].vote;
      }
    }

    res.json({
      success: true,
      data: {
        prediction,
        community_votes,
        user_vote: userVote
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.submitVote = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const { vote } = req.body;
    const userId = req.user.id;

    if (!['home', 'draw', 'away'].includes(vote)) {
      return res.status(400).json({ success: false, message: 'Invalid vote type' });
    }

    // Upsert vote
    await db.query(`
      INSERT INTO prediction_votes (user_id, match_id, vote)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, match_id) 
      DO UPDATE SET vote = EXCLUDED.vote, created_at = CURRENT_TIMESTAMP
    `, [userId, matchId, vote]);

    res.json({ success: true, message: 'Vote submitted successfully' });
  } catch (err) {
    next(err);
  }
};
