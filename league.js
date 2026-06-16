let leagueData = null;

// Get League ID from URL
const urlParams = new URLSearchParams(window.location.search);
const leagueId = urlParams.get('id') || 'PL';

const API_URL = (typeof API_BASE !== 'undefined') ? API_BASE : (['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'http://localhost:5000/api' : '/api');

async function fetchLeagueDetails() {
  const season = document.getElementById('season-filter').value;
  
  // SKELETON LOADING STATE
  const loaders = `
    <tr><td colspan="11"><div class="skeleton skeleton-text long"></div></td></tr>
    <tr><td colspan="11"><div class="skeleton skeleton-text"></div></td></tr>
    <tr><td colspan="11"><div class="skeleton skeleton-text short"></div></td></tr>
  `;
  document.getElementById('standings-body').innerHTML = loaders;
  document.getElementById('scorers-container').innerHTML = `<div class="skeleton skeleton-card"></div>`;
  document.getElementById('assists-container').innerHTML = `<div class="skeleton skeleton-card"></div>`;
  document.querySelector('#tab-fixtures .data-table-wrapper').innerHTML = `<div class="skeleton skeleton-card"></div>`;
  document.querySelector('#tab-results .data-table-wrapper').innerHTML = `<div class="skeleton skeleton-card"></div>`;
  document.getElementById('teams-container').innerHTML = `<div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div>`;
  
  try {
    const res = await fetch(`${API_URL}/leagues/${leagueId}?season=${encodeURIComponent(season)}`);
    const json = await res.json();
    if (json.success) {
      leagueData = json.data;
      renderAll();
    } else {
      throw new Error(json.message);
    }
  } catch (err) {
    console.error('Failed to fetch league details:', err);
    document.getElementById('league-name').textContent = 'League Not Found';
    
    // ERROR STATE
    const errorHtml = `
      <div class="error-state">
        <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <div class="error-title">Connection Failed</div>
        <p style="color:var(--muted)">Unable to load league data from the server.</p>
        <button class="error-retry-btn" onclick="fetchLeagueDetails()">Try Again</button>
      </div>
    `;
    document.getElementById('standings-body').innerHTML = `<tr><td colspan="11">${errorHtml}</td></tr>`;
  }
}

function renderAll() {
  renderHero();
  renderStandings();
  renderTopScorers();
  renderTopAssists();
  renderFixtures();
  renderResults();
  renderTeams();
}

function renderHero() {
  const L = leagueData;
  document.getElementById('league-hero').style.backgroundImage = `url('${L.banner_url}')`;
  document.getElementById('league-logo').innerHTML = `<img src="${L.logo_url}" alt="${L.name}">`;
  document.getElementById('league-name').textContent = L.name;
  document.getElementById('league-country').textContent = `📍 ${L.country} | Season ${L.season}`;
}

function renderStandings() {
  const tbody = document.getElementById('standings-body');
  const s = leagueData.standings;
  
  if (!s || s.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11">
      <div class="empty-state">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div class="empty-state-title">No Standings Available</div>
        <div class="empty-state-desc">The season hasn't started or data is unavailable.</div>
      </div>
    </td></tr>`;
    return;
  }

  const renderForm = (formArray) => {
    return `<div class="form-badges">` + formArray.map(f => {
      const cls = f === 'W' ? 'form-w' : f === 'D' ? 'form-d' : 'form-l';
      return `<div class="form-badge ${cls}">${f}</div>`;
    }).join('') + `</div>`;
  };

  tbody.innerHTML = s.map((row, index) => {
    // Styling classes for Champions League (top 4) or Relegation (bottom 3) - rough approximation
    let posClass = '';
    if (row.pos <= 4) posClass = 'pos-cl';
    if (row.pos >= 18) posClass = 'pos-rel';

    return `
      <tr style="cursor: pointer; transition: background 0.2s;" onclick="window.location.href='team.html?id=${row.team_id}'" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background=''">
        <td class="col-pos ${posClass}">${row.pos}</td>
        <td class="col-team">
          <img src="${row.crest}" alt="${row.team}" class="team-crest-small">
          ${row.team}
        </td>
        <td>${row.pld}</td>
        <td class="hide-mobile">${row.w}</td>
        <td class="hide-mobile">${row.d}</td>
        <td class="hide-mobile">${row.l}</td>
        <td class="hide-mobile">${row.gf}</td>
        <td class="hide-mobile">${row.ga}</td>
        <td>${row.gd > 0 ? '+'+row.gd : row.gd}</td>
        <td class="col-pts">${row.pts}</td>
        <td class="hide-mobile">${renderForm(row.form)}</td>
      </tr>
    `;
  }).join('');
}

function renderTopScorers() {
  const container = document.getElementById('scorers-container');
  const ts = leagueData.top_scorers;

  if (!ts || ts.length === 0) {
    container.innerHTML = `<div style="color:var(--muted); padding:20px;">No goalscorer data available.</div>`;
    return;
  }

  container.innerHTML = ts.map(p => `
    <div class="leaderboard-item">
      <div class="lb-rank">#${p.rank}</div>
      <div class="lb-photo"><img src="${p.photo}" alt="${p.player}" onerror="this.src='https://cdn.sportmonks.com/images/soccer/placeholder.png'"></div>
      <div class="lb-info">
        <div class="lb-name">${p.player}</div>
        <div class="lb-team"><img src="${p.crest}" alt="Crest"> ${p.team}</div>
      </div>
      <div>
        <div class="lb-stat">${p.goals}</div>
        <span class="lb-stat-label">Goals</span>
      </div>
    </div>
  `).join('');
}

function renderTopAssists() {
  const container = document.getElementById('assists-container');
  const ta = leagueData.top_assists;

  if (!ta || ta.length === 0) {
    container.innerHTML = `<div style="color:var(--muted); padding:20px;">No assist data available.</div>`;
    return;
  }

  container.innerHTML = ta.map(p => `
    <div class="leaderboard-item">
      <div class="lb-rank">#${p.rank}</div>
      <div class="lb-photo"><img src="${p.photo}" alt="${p.player}" onerror="this.src='https://cdn.sportmonks.com/images/soccer/placeholder.png'"></div>
      <div class="lb-info">
        <div class="lb-name">${p.player}</div>
        <div class="lb-team"><img src="${p.crest}" alt="Crest"> ${p.team}</div>
      </div>
      <div>
        <div class="lb-stat">${p.assists}</div>
        <span class="lb-stat-label">Assists</span>
      </div>
    </div>
  `).join('');
}

function renderFixtures() {
  const container = document.querySelector('#tab-fixtures .data-table-wrapper');
  const teamFilter = document.getElementById('team-filter').value;
  const matchdayFilter = document.getElementById('matchday-filter').value;
  
  let fixtures = leagueData.fixtures || [];

  if (teamFilter !== 'all') {
    fixtures = fixtures.filter(f => f.home.toLowerCase() === teamFilter || f.away.toLowerCase() === teamFilter);
  }
  if (matchdayFilter !== 'all') {
    fixtures = fixtures.filter(f => f.matchday.toString() === matchdayFilter);
  }

  if (fixtures.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <div class="empty-state-title">No Fixtures Found</div>
        <div class="empty-state-desc">There are no upcoming fixtures for the selected filters.</div>
      </div>`;
    return;
  }

  container.innerHTML = fixtures.map(f => `
    <div class="leaderboard-item" style="justify-content: space-between; border-radius: 0; border-left: none; border-right: none; margin-bottom: -1px;">
      <div style="flex: 1; text-align: right; display: flex; align-items: center; justify-content: flex-end; gap: 15px;">
        <span style="font-weight: 600; font-size: 1.1rem;">${f.home}</span>
        <img src="${f.home_crest}" style="width: 35px; height: 35px; object-fit: contain;">
      </div>
      
      <div style="padding: 0 30px; text-align: center;">
        <div style="background: rgba(255,255,255,0.05); padding: 5px 15px; border-radius: 6px; font-weight: 700; color: var(--accent); letter-spacing: 1px;">
          ${f.time}
        </div>
        <div style="font-size: 0.8rem; color: var(--muted); margin-top: 5px; text-transform: uppercase;">${f.date}</div>
      </div>
      
      <div style="flex: 1; text-align: left; display: flex; align-items: center; justify-content: flex-start; gap: 15px;">
        <img src="${f.away_crest}" style="width: 35px; height: 35px; object-fit: contain;">
        <span style="font-weight: 600; font-size: 1.1rem;">${f.away}</span>
      </div>
    </div>
  `).join('');
}

function renderResults() {
  const container = document.querySelector('#tab-results .data-table-wrapper');
  const teamFilter = document.getElementById('team-filter').value;
  const matchdayFilter = document.getElementById('matchday-filter').value;
  
  let results = leagueData.results || [];

  if (teamFilter !== 'all') {
    results = results.filter(f => f.home.toLowerCase() === teamFilter || f.away.toLowerCase() === teamFilter);
  }
  if (matchdayFilter !== 'all') {
    results = results.filter(f => f.matchday.toString() === matchdayFilter);
  }

  if (results.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <div class="empty-state-title">No Results Found</div>
        <div class="empty-state-desc">There are no match results for the selected filters.</div>
      </div>`;
    return;
  }

  container.innerHTML = results.map(f => `
    <div class="leaderboard-item" style="justify-content: space-between; border-radius: 0; border-left: none; border-right: none; margin-bottom: -1px;">
      <div style="flex: 1; text-align: right; display: flex; align-items: center; justify-content: flex-end; gap: 15px;">
        <span style="font-weight: ${f.home_score > f.away_score ? '800; color: #fff;' : '500; color: var(--muted);'} font-size: 1.1rem;">${f.home}</span>
        <img src="${f.home_crest}" style="width: 35px; height: 35px; object-fit: contain;">
      </div>
      
      <div style="padding: 0 30px; text-align: center; display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 1.8rem; font-weight: 800; color: ${f.home_score > f.away_score ? 'var(--accent)' : '#fff'};">${f.home_score}</span>
        <span style="color: var(--muted);">-</span>
        <span style="font-size: 1.8rem; font-weight: 800; color: ${f.away_score > f.home_score ? 'var(--accent)' : '#fff'};">${f.away_score}</span>
      </div>
      
      <div style="flex: 1; text-align: left; display: flex; align-items: center; justify-content: flex-start; gap: 15px;">
        <img src="${f.away_crest}" style="width: 35px; height: 35px; object-fit: contain;">
        <span style="font-weight: ${f.away_score > f.home_score ? '800; color: #fff;' : '500; color: var(--muted);'} font-size: 1.1rem;">${f.away}</span>
      </div>
    </div>
  `).join('');
}

function renderTeams() {
  const container = document.getElementById('teams-container');
  const teams = leagueData.teams || [];

  if (teams.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        <div class="empty-state-title">No Teams Found</div>
      </div>`;
    return;
  }

  container.innerHTML = teams.map(t => `
    <article class="league-card" role="button" tabindex="0" onclick="window.location.href='team.html?id=${t.id}'">
      <div class="league-card-emblem">
        <img src="${t.logo}" alt="${t.name}" style="width: 40px; height: 40px; object-fit: contain;">
      </div>
      <div class="league-card-name">${t.name}</div>
      <div class="league-card-country">${t.venue || 'Stadium'} • Est. ${t.founded || 'N/A'}</div>
    </article>
  `).join('');
}

// Event Listeners for Filters
document.getElementById('season-filter').addEventListener('change', fetchLeagueDetails);
document.getElementById('team-filter').addEventListener('change', () => {
  renderFixtures();
  renderResults();
});
document.getElementById('matchday-filter').addEventListener('change', () => {
  renderFixtures();
  renderResults();
});

// Tab Switching
document.querySelectorAll('.league-tab').forEach(tab => {
  tab.addEventListener('click', (e) => {
    document.querySelectorAll('.league-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
    
    e.target.classList.add('active');
    const targetId = `tab-${e.target.dataset.tab}`;
    document.getElementById(targetId).classList.add('active');
  });
});

document.addEventListener('DOMContentLoaded', fetchLeagueDetails);
