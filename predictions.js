const API_URL = (typeof API_BASE !== 'undefined') ? API_BASE : (['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'http://localhost:5000/api' : '/api');

const MOCK_FIXTURES = [
  { id: '101', home: 'Arsenal', home_crest: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg', away: 'Man City', away_crest: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg' },
  { id: '102', home: 'Real Madrid', home_crest: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg', away: 'Barcelona', away_crest: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg' },
  { id: '103', home: 'Liverpool', home_crest: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg', away: 'Chelsea', away_crest: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg' },
  { id: '104', home: 'Bayern Munich', home_crest: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg', away: 'Dortmund', away_crest: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg' }
];

async function loadPredictions() {
  const grid = document.getElementById('predictions-grid');
  grid.innerHTML = ''; // clear loading state

  for (const match of MOCK_FIXTURES) {
    try {
      const headers = {};
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/predictions/${match.id}`, { headers });
      const json = await res.json();
      
      if (json.success) {
        renderCard(match, json.data);
      }
    } catch (err) {
      console.error(`Failed to load prediction for match ${match.id}:`, err);
    }
  }
}

function renderCard(match, data) {
  const grid = document.getElementById('predictions-grid');
  const { prediction, community_votes, user_vote } = data;

  const renderForm = (form) => form.map(f => `<div class="form-badge f-${f}">${f}</div>`).join('');

  // Determine if we should show voting buttons or results
  let voteUI = '';
  if (user_vote) {
    // Show results
    voteUI = `
      <div class="vote-results" style="display: flex;">
        <div style="font-size: 0.8rem; color: var(--muted); text-align: center; margin-bottom: 10px;">You voted for <strong>${user_vote.toUpperCase()}</strong>. Total votes: ${community_votes.total}</div>
        
        <div class="vote-result-row">
          <div class="vote-result-label">HOME</div>
          <div class="vote-result-bar-bg"><div class="vote-result-bar-fill" style="width: ${community_votes.home_pct}%; background: #3b82f6;"></div></div>
          <div class="vote-result-pct" style="color: #3b82f6;">${community_votes.home_pct}%</div>
        </div>
        
        <div class="vote-result-row">
          <div class="vote-result-label">DRAW</div>
          <div class="vote-result-bar-bg"><div class="vote-result-bar-fill" style="width: ${community_votes.draw_pct}%; background: #64748b;"></div></div>
          <div class="vote-result-pct" style="color: #64748b;">${community_votes.draw_pct}%</div>
        </div>

        <div class="vote-result-row">
          <div class="vote-result-label">AWAY</div>
          <div class="vote-result-bar-bg"><div class="vote-result-bar-fill" style="width: ${community_votes.away_pct}%; background: #ef4444;"></div></div>
          <div class="vote-result-pct" style="color: #ef4444;">${community_votes.away_pct}%</div>
        </div>
      </div>
    `;
  } else {
    // Show buttons
    voteUI = `
      <div class="vote-title">Who will win?</div>
      <div class="vote-buttons" id="vote-btns-${match.id}">
        <button class="vote-btn" onclick="submitVote('${match.id}', 'home')">Home</button>
        <button class="vote-btn" onclick="submitVote('${match.id}', 'draw')">Draw</button>
        <button class="vote-btn" onclick="submitVote('${match.id}', 'away')">Away</button>
      </div>
    `;
  }

  const cardHtml = `
    <div class="pred-card">
      <div class="confidence-badge">🤖 AI Confidence: ${prediction.confidence}%</div>
      <div class="pred-header">
        <div class="pred-team">
          <img src="${match.home_crest}" class="pred-crest" alt="${match.home}">
          <div class="pred-team-name">${match.home}</div>
        </div>
        <div class="pred-vs">VS</div>
        <div class="pred-team">
          <img src="${match.away_crest}" class="pred-crest" alt="${match.away}">
          <div class="pred-team-name">${match.away}</div>
        </div>
      </div>

      <div class="pred-body">
        <div class="prob-container">
          <div class="prob-labels">
            <span>HOME: ${prediction.home_win_prob}%</span>
            <span>DRAW: ${prediction.draw_prob}%</span>
            <span>AWAY: ${prediction.away_win_prob}%</span>
          </div>
          <div class="prob-bar-wrapper">
            <div class="prob-segment prob-home" style="width: ${prediction.home_win_prob}%"></div>
            <div class="prob-segment prob-draw" style="width: ${prediction.draw_prob}%"></div>
            <div class="prob-segment prob-away" style="width: ${prediction.away_win_prob}%"></div>
          </div>
        </div>

        <div class="insights-grid">
          <div class="insight-item">
            <div class="insight-label">Home Form</div>
            <div class="form-badges">${renderForm(prediction.home_form)}</div>
          </div>
          <div class="insight-item">
            <div class="insight-label">Away Form</div>
            <div class="form-badges">${renderForm(prediction.away_form)}</div>
          </div>
        </div>
      </div>

      <div class="voting-section" id="voting-sec-${match.id}">
        ${voteUI}
      </div>
    </div>
  `;

  grid.insertAdjacentHTML('beforeend', cardHtml);
}

window.submitVote = async function(matchId, voteType) {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please log in to participate in community voting!');
    return;
  }

  try {
    // Disable buttons instantly to prevent spam
    const btns = document.querySelectorAll(`#vote-btns-${matchId} .vote-btn`);
    btns.forEach(b => {
      b.disabled = true;
      if (b.innerText.toLowerCase() === voteType) b.classList.add('selected');
    });

    const res = await fetch(`${API_URL}/predictions/${matchId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ vote: voteType })
    });

    const json = await res.json();
    if (json.success) {
      // Reload this specific prediction card state
      // A full page reload is a lazy way, but let's just re-fetch and re-render grid
      loadPredictions(); 
    } else {
      alert(json.message);
      btns.forEach(b => b.disabled = false);
    }
  } catch (err) {
    console.error('Vote failed:', err);
  }
};

document.addEventListener('DOMContentLoaded', loadPredictions);
