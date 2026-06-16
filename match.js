let matchData = null;
let socket = null;

// Get Match ID from URL
const urlParams = new URLSearchParams(window.location.search);
const matchId = urlParams.get('id');

const API_URL = (typeof API_BASE !== 'undefined') ? API_BASE : (['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'http://localhost:5000/api' : '/api');
const SOCKET_URL = API_URL.replace('/api', '');

async function fetchMatchDetails() {
  if (!matchId) {
    document.getElementById('match-hero').innerHTML = `<div style="text-align:center; padding: 50px;">No Match Selected. <a href="index.html" style="color:var(--accent);">Go back</a></div>`;
    return;
  }

  try {
    const res = await fetch(`${API_URL}/matches/${matchId}`);
    const json = await res.json();
    if (json.success) {
      matchData = json.data.match;
      
      // Dynamic SEO Updates
      document.title = `${matchData.home_team.name} vs ${matchData.away_team.name} | Live Score & Analytics | PitchLive`;
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = `Live match analytics, statistics, and scores for ${matchData.home_team.name} vs ${matchData.away_team.name} in the ${matchData.league}.`;

      // JSON-LD Schema
      let script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SportsEvent",
        "name": `${matchData.home_team.name} vs ${matchData.away_team.name}`,
        "homeTeam": { "@type": "SportsTeam", "name": matchData.home_team.name },
        "awayTeam": { "@type": "SportsTeam", "name": matchData.away_team.name },
        "sport": "Football"
      });
      document.head.appendChild(script);

      renderAll();
      setupRealTime();
    } else {
      throw new Error(json.message);
    }
  } catch (err) {
    console.error('Failed to fetch match details:', err);
    document.getElementById('match-hero').innerHTML = `<div style="text-align:center; padding: 50px; color: #ef4444;">Failed to load match details.</div>`;
  }
}

const safeHTML = (html) => window.DOMPurify ? DOMPurify.sanitize(html) : html;

function renderAll() {
  renderHero();
  renderTimeline();
  renderStats();
  renderForm();
  renderMomentum();
}

function renderHero() {
  const m = matchData;
  const hero = document.getElementById('match-hero');
  const html = `
    <div class="match-scoreboard">
      <div class="match-team">
        <div class="match-crest-wrap">
          <img src="assets/teams/${m.home_team.crest}" alt="${m.home_team.short_name}" loading="lazy" decoding="async">
        </div>
        <div class="match-team-name">${m.home_team.name}</div>
      </div>

      <div class="match-center">
        <div class="match-meta">🏆 ${m.league}</div>
        <div class="match-score-main">
          <span id="score-home" class="${m.status==='live'?'flash':''}">${m.home_score}</span>
          <span>-</span>
          <span id="score-away" class="${m.status==='live'?'flash':''}">${m.away_score}</span>
        </div>
        <div class="match-status-badge ${m.status}" id="match-status">
          ${m.status === 'live' ? `🔴 LIVE ${m.minute}'` : m.status === 'halftime' ? '⏸ HALF TIME' : 'FULL TIME'}
        </div>
        <button class="btn-outline-sm share-btn" id="share-match-btn" style="margin-top: 10px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="margin-right: 5px;"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          Share
        </button>
      </div>

      <div class="match-team">
        <div class="match-crest-wrap">
          <img src="assets/teams/${m.away_team.crest}" alt="${m.away_team.short_name}" loading="lazy" decoding="async">
        </div>
        <div class="match-team-name">${m.away_team.name}</div>
      </div>
    </div>
  `;
  hero.innerHTML = safeHTML(html);

  // Re-attach event listener without inline onclick
  const shareBtn = document.getElementById('share-match-btn');
  if (shareBtn) shareBtn.addEventListener('click', shareMatch);
}

function renderTimeline() {
  const container = document.getElementById('timeline-container');
  if (!matchData.events || matchData.events.length === 0) {
    container.innerHTML = `<div style="text-align:center; color:var(--muted); margin-top:30px;">No events yet.</div>`;
    return;
  }

  // Sort events descending
  const sorted = [...matchData.events].sort((a, b) => b.minute - a.minute);

  const html = sorted.map(e => {
    const isHome = e.team === 'home';
    const icon = e.type === 'goal' ? '⚽' : e.type === 'yellow_card' ? '🟨' : e.type === 'red_card' ? '🟥' : '🔄';
    const assistHtml = e.assist ? `<div class="timeline-assist">Assist: ${e.assist}</div>` : '';
    
    return `
      <div class="timeline-event ${e.team}">
        <div class="timeline-minute">${e.minute}'</div>
        <div class="timeline-content">
          <div class="timeline-icon">${icon}</div>
          <div>
            <div class="timeline-player">${e.player}</div>
            ${assistHtml}
          </div>
        </div>
      </div>
    `;
  }).join('');
  container.innerHTML = safeHTML(html);
}

function renderStats() {
  const container = document.getElementById('stats-container');
  if (!matchData.stats) return;

  const s = matchData.stats;
  
  const buildRow = (label, homeVal, awayVal, reverseHigh = false) => {
    const homeFloat = parseFloat(homeVal) || 0;
    const awayFloat = parseFloat(awayVal) || 0;
    const total = homeFloat + awayFloat || 1;
    const homePct = (homeFloat / total) * 100;
    const awayPct = 100 - homePct;
    
    return `
      <div class="stat-row">
        <div class="stat-labels">
          <span style="color: ${homePct >= awayPct ? '#fff' : 'var(--muted)'}">${homeVal}${label==='Possession'?'%':''}</span>
          <span style="color: var(--muted)">${label}</span>
          <span style="color: ${awayPct >= homePct ? '#fff' : 'var(--muted)'}">${awayVal}${label==='Possession'?'%':''}</span>
        </div>
        <div class="stat-bar-container">
          <div class="stat-bar-home" style="width: ${homePct}%"></div>
          <div class="stat-bar-away" style="width: ${awayPct}%"></div>
        </div>
      </div>
    `;
  };

  const html = `
    ${buildRow('Possession', s.possession.home, s.possession.away)}
    ${buildRow('Total Shots', s.shots.home, s.shots.away)}
    ${buildRow('Shots on Target', s.shots_on_target.home, s.shots_on_target.away)}
    ${buildRow('Pass Accuracy', s.pass_accuracy.home, s.pass_accuracy.away)}
    ${buildRow('Corners', s.corners.home, s.corners.away)}
    ${buildRow('Fouls', s.fouls.home, s.fouls.away, true)}
  `;
  container.innerHTML = safeHTML(html);
}

function renderForm() {
  const container = document.getElementById('form-container');
  const renderBadges = (formArray) => {
    return formArray.map(r => {
      const color = r === 'W' ? '#22c55e' : r === 'D' ? '#64748b' : '#ef4444';
      return `<span style="display:inline-block; width:24px; height:24px; line-height:24px; text-align:center; border-radius:4px; font-size:0.8rem; font-weight:bold; background:${color}33; color:${color}; margin-right:4px;">${r}</span>`;
    }).join('');
  };

  const html = `
    <div style="margin-bottom: 15px;">
      <div style="font-size: 0.9rem; color:var(--muted); margin-bottom:5px;">${matchData.home_team.name}</div>
      <div>${renderBadges(matchData.form.home)}</div>
    </div>
    <div>
      <div style="font-size: 0.9rem; color:var(--muted); margin-bottom:5px;">${matchData.away_team.name}</div>
      <div>${renderBadges(matchData.form.away)}</div>
    </div>
  `;
  container.innerHTML = safeHTML(html);
}

function renderMomentum() {
  const container = document.getElementById('momentum-graph');
  let html = '';
  // Generate random momentum bars for demonstration based on stats
  for(let i=0; i<45; i++) {
    const hAdv = Math.random() > 0.5;
    const height = Math.random() * 80 + 10;
    html += `<div class="momentum-bar ${hAdv?'':'away-adv'}" style="height:${height}%"></div>`;
  }
  container.innerHTML = safeHTML(html);
}

// Tab Switching
document.querySelectorAll('.match-tab').forEach(tab => {
  tab.addEventListener('click', (e) => {
    document.querySelectorAll('.match-tab').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    
    const target = e.target.dataset.target;
    document.getElementById('timeline-container').style.display = target === 'timeline' ? 'block' : 'none';
    document.getElementById('momentum-container').style.display = target === 'momentum' ? 'block' : 'none';
    
    // Lineups placeholder
    if (target === 'lineups') {
      document.getElementById('timeline-container').style.display = 'block';
      document.getElementById('timeline-container').innerHTML = `<div style="text-align:center; color:var(--muted); padding: 40px;">Lineups will be announced 1 hour before kick-off.</div>`;
    } else if (target === 'timeline') {
      renderTimeline();
    }
  });
});

/* ==========================================
   LIVE SCORE UPDATES (Socket.IO)
   ========================================== */
function setupRealTime() {
  if (typeof io === 'undefined') return;
  socket = io(SOCKET_URL);

  socket.on('connect', () => {
    console.log(`🔌 Connected to match room: ${matchId}`);
    socket.emit('join_match', matchId);
  });

  socket.on('minute_tick', (data) => {
    matchData.minute = data.minute;
    const statusEl = document.getElementById('match-status');
    if (statusEl) statusEl.textContent = `🔴 LIVE ${data.minute}'`;
  });

  socket.on('score_update', (data) => {
    matchData.home_score = data.home_score;
    matchData.away_score = data.away_score;
    matchData.events.push(data.event);
    
    document.getElementById('score-home').textContent = data.home_score;
    document.getElementById('score-away').textContent = data.away_score;
    
    renderTimeline();
    
    // Add brief flash animation
    document.getElementById('score-home').classList.add('flash');
    document.getElementById('score-away').classList.add('flash');
    setTimeout(() => {
      document.getElementById('score-home').classList.remove('flash');
      document.getElementById('score-away').classList.remove('flash');
    }, 1000);
  });

  socket.on('match_event', (data) => {
    matchData.events.push(data.event);
    renderTimeline();
  });

  socket.on('stats_update', (data) => {
    matchData.stats = data.stats;
    renderStats();
  });

  socket.on('match_status_change', (data) => {
    matchData.status = data.status;
    if (data.minute) matchData.minute = data.minute;
    renderHero(); // Re-render whole hero for status color changes
  });
}

document.addEventListener('DOMContentLoaded', fetchMatchDetails);

