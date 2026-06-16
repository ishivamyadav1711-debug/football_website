let teamData = null;

// Get Team ID from URL
const urlParams = new URLSearchParams(window.location.search);
const teamId = urlParams.get('id') || '1'; // Default to 1 (Arsenal) if no ID

const API_URL = (typeof API_BASE !== 'undefined') ? API_BASE : (['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'http://localhost:5000/api' : '/api');

async function fetchTeamDetails() {
  try {
    const res = await fetch(`${API_URL}/teams/${teamId}`);
    const json = await res.json();
    if (json.success) {
      teamData = json.data.team;
      renderAll();
    } else {
      throw new Error(json.message);
    }
  } catch (err) {
    console.error('Failed to fetch team details:', err);
    document.getElementById('team-name').textContent = 'Team Not Found';
  }
}

function renderAll() {
  renderHero();
  renderOverview();
  renderSquad();
  renderFixtures();
  renderResults();
  renderStats();
}

function renderHero() {
  const t = teamData;
  document.getElementById('team-hero').style.backgroundImage = `url('${t.banner_url}')`;
  document.getElementById('team-logo').innerHTML = `<img src="${t.logo_url}" alt="${t.name} Logo">`;
  document.getElementById('team-name').textContent = t.name;
  
  document.getElementById('team-meta').innerHTML = `
    <span>🏆 ${t.league}</span>
    <span>📍 ${t.stadium}, ${t.country}</span>
  `;
}

function renderOverview() {
  const t = teamData;
  document.getElementById('overview-text').textContent = t.overview;
  
  document.getElementById('overview-info').innerHTML = `
    <div class="info-item"><label>Founded</label><span>${t.founded || 'Unknown'}</span></div>
    <div class="info-item"><label>Manager</label><span>${t.manager || 'Unknown'}</span></div>
    <div class="info-item"><label>Stadium</label><span>${t.stadium || 'Unknown'}</span></div>
    <div class="info-item"><label>Capacity</label><span>${t.capacity || 'N/A'}</span></div>
  `;
}

function renderSquad() {
  const container = document.getElementById('squad-container');
  const t = teamData;

  const grouped = {
    'Goalkeeper': [],
    'Defender': [],
    'Midfielder': [],
    'Attacker': []
  };

  t.squad.forEach(p => grouped[p.position].push(p));

  let html = '';
  ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker'].forEach(pos => {
    if (grouped[pos].length > 0) {
      html += `<h2 class="squad-group-title">${pos}s</h2>`;
      html += `<div class="squad-grid">`;
      html += grouped[pos].map(p => `
        <article class="player-card" onclick="window.location.href='player.html?id=${p.id}&api=true'">
          <div class="player-img-wrap">
            <img src="${p.image}" alt="${p.name}" onerror="this.src='https://cdn.sportmonks.com/images/soccer/placeholder.png'">
            <div class="player-rating-badge">${p.rating}</div>
          </div>
          <div class="player-info">
            <div class="player-name">${p.name}</div>
            <div class="player-pos">${p.position}</div>
            <div class="player-meta">
              <span>🎂 ${p.age || '?'}</span>
              <span>${p.nationality}</span>
            </div>
          </div>
        </article>
      `).join('');
      html += `</div>`;
    }
  });

  container.innerHTML = html;
}

function renderFixtures() {
  const container = document.getElementById('fixtures-container');
  const f = teamData.fixtures;
  
  if (!f || f.length === 0) {
    container.innerHTML = `<div style="color:var(--muted)">No upcoming fixtures.</div>`;
    return;
  }

  container.innerHTML = f.map(m => `
    <div class="list-row">
      <div class="list-date">${m.date}</div>
      <div class="list-main">${m.venue === 'Home' ? 'vs' : '@'} ${m.opponent}</div>
      <div class="list-comp">${m.competition}</div>
    </div>
  `).join('');
}

function renderResults() {
  const container = document.getElementById('results-container');
  const r = teamData.results;
  
  if (!r || r.length === 0) {
    container.innerHTML = `<div style="color:var(--muted)">No recent results.</div>`;
    return;
  }

  container.innerHTML = r.map(m => {
    const isWin = m.result.startsWith('W');
    const isDraw = m.result.startsWith('D');
    const badgeClass = isWin ? 'bg-green' : isDraw ? 'bg-gray' : 'bg-red';
    
    return `
      <div class="list-row">
        <div class="list-date">${m.date}</div>
        <div class="list-main">${m.venue === 'Home' ? 'vs' : '@'} ${m.opponent}</div>
        <div class="list-comp">${m.competition}</div>
        <div class="list-badge ${badgeClass}">${m.result}</div>
      </div>
    `;
  }).join('');
}

function renderStats() {
  const container = document.getElementById('stats-container');
  const s = teamData.stats;

  if (!s || s.played === 0) {
    container.innerHTML = `<div style="color:var(--muted)">No statistics available for this team.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="info-item"><label>Matches Played</label><span>${s.played}</span></div>
    <div class="info-item"><label>Wins</label><span>${s.won}</span></div>
    <div class="info-item"><label>Draws</label><span>${s.drawn}</span></div>
    <div class="info-item"><label>Losses</label><span>${s.lost}</span></div>
    <div class="info-item"><label>Goals For</label><span>${s.goals_for}</span></div>
    <div class="info-item"><label>Goals Against</label><span>${s.goals_against}</span></div>
    <div class="info-item"><label>Clean Sheets</label><span>${s.clean_sheets}</span></div>
    <div class="info-item"><label>Yellow/Red Cards</label><span>${s.yellow_cards} / ${s.red_cards}</span></div>
  `;
}

// Tab Switching
document.querySelectorAll('.team-tab').forEach(tab => {
  tab.addEventListener('click', (e) => {
    document.querySelectorAll('.team-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
    
    e.target.classList.add('active');
    const targetId = `tab-${e.target.dataset.tab}`;
    document.getElementById(targetId).classList.add('active');
  });
});

document.addEventListener('DOMContentLoaded', fetchTeamDetails);
