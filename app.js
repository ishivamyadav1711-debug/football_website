/* ====================================================
   PitchLive — APP.JS
   Interactive Logic, Data Rendering, Animations
   ==================================================== */

'use strict';

/* ==========================================
   DATA LAYER — Mock Sports Data
   ========================================== */

let LIVE_MATCHES = [];

// FIXTURES data will now be fetched from the backend

let STANDINGS = [
  { pos: 1, team: 'Man City', crest: '🔵', p: 34, w: 25, d: 5, l: 4, gd: '+42', pts: 80, form: ['w','w','w','d','w'], type: 'cl' },
  { pos: 2, team: 'Arsenal', crest: '🔴', p: 34, w: 24, d: 6, l: 4, gd: '+38', pts: 78, form: ['w','w','d','w','w'], type: 'cl' },
  { pos: 3, team: 'Liverpool', crest: '🔴', p: 34, w: 22, d: 7, l: 5, gd: '+35', pts: 73, form: ['w','d','w','w','l'], type: 'cl' },
  { pos: 4, team: 'Aston Villa', crest: '🟣', p: 34, w: 20, d: 5, l: 9, gd: '+18', pts: 65, form: ['l','w','w','d','w'], type: 'cl' },
  { pos: 5, team: 'Tottenham', crest: '⚪', p: 34, w: 18, d: 6, l: 10, gd: '+12', pts: 60, form: ['w','w','l','w','d'], type: 'el' },
  { pos: 17, team: 'Luton Town', crest: '🟠', p: 34, w: 6, d: 8, l: 20, gd: '-32', pts: 26, form: ['l','l','d','l','l'], type: 'rel' },
  { pos: 18, team: 'Burnley', crest: '🟤', p: 34, w: 5, d: 5, l: 24, gd: '-40', pts: 20, form: ['l','l','l','d','l'], type: 'rel' },
];



const NEWS_ARTICLES = [
  {
    id: 1, featured: true,
    tag: 'Transfer', category: 'transfers',
    emoji: '💸',
    title: 'Kylian Mbappé to Real Madrid: The Full Story Behind Football\'s Biggest Ever Transfer',
    author: 'James Pearce', time: '2h ago', readTime: '5 min read',
    gradient: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
  },
  {
    id: 2, featured: false,
    tag: 'Analysis',  category: 'analysis',
    emoji: '📊',
    title: 'How Pep Guardiola\'s High Press is Dominating the Modern Game',
    author: 'Michael Cox', time: '4h ago', readTime: '7 min read',
    gradient: 'linear-gradient(135deg, #0d1b2a, #1b3a4b, #0d2137)',
  },
  {
    id: 3, featured: false,
    tag: 'Interview', category: 'interviews',
    emoji: '🎙️',
    title: 'Erling Haaland: "I Want to Break Every Record There Is in Football"',
    author: 'Simon Stone', time: '6h ago', readTime: '4 min read',
    gradient: 'linear-gradient(135deg, #0a192f, #172a45, #0d2137)',
  },
];

const TRENDING = [
  { tag: 'Transfer', title: 'Bellingham Signs 5-Year Extension with Real Madrid', time: '30 min ago', category: 'transfers' },
  { tag: 'Injury', title: 'Salah Faces 3-Week Absence After Hamstring Concern', time: '1h ago', category: 'all' },
  { tag: 'Matchday', title: 'Arsenal vs Chelsea — 5 Things to Watch in the Derby', time: '2h ago', category: 'analysis' },
  { tag: 'Record', title: 'Haaland Breaks Premier League Season Goals Record', time: '3h ago', category: 'all' },
  { tag: 'Transfer', title: 'Barcelona Close In on €80M Lamine Yamal Deal Extension', time: '5h ago', category: 'transfers' },
];

let PLAYERS = {
  goals: [
    { rank: 1, name: 'E. Haaland', club: 'Man City', flag: '🇳🇴', emoji: '🟡', stat: 35, games: 30, assists: 8, rating: 8.4 },
    { rank: 2, name: 'H. Kane', club: 'Bayern Munich', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', emoji: '🔴', stat: 31, games: 32, assists: 10, rating: 8.2 },
    { rank: 3, name: 'K. Mbappé', club: 'Real Madrid', flag: '🇫🇷', emoji: '⚪', stat: 28, games: 30, assists: 12, rating: 8.5 },
    { rank: 4, name: 'V. Osimhen', club: 'Napoli', flag: '🇳🇬', emoji: '🔵', stat: 25, games: 29, assists: 5, rating: 7.9 },
    { rank: 5, name: 'M. Salah', club: 'Liverpool', flag: '🇪🇬', emoji: '🔴', stat: 22, games: 31, assists: 14, rating: 8.1 },
  ],
  assists: [
    { rank: 1, name: 'T. Alexander-Arnold', club: 'Liverpool', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', emoji: '🔴', stat: 18, games: 32, goals: 5, rating: 8.0 },
    { rank: 2, name: 'M. Salah', club: 'Liverpool', flag: '🇪🇬', emoji: '🔴', stat: 14, games: 31, goals: 22, rating: 8.1 },
    { rank: 3, name: 'K. De Bruyne', club: 'Man City', flag: '🇧🇪', emoji: '🔵', stat: 13, games: 28, goals: 7, rating: 8.3 },
    { rank: 4, name: 'K. Mbappé', club: 'Real Madrid', flag: '🇫🇷', emoji: '⚪', stat: 12, games: 30, goals: 28, rating: 8.5 },
    { rank: 5, name: 'L. Messi', club: 'Inter Miami', flag: '🇦🇷', emoji: '🌸', stat: 11, games: 26, goals: 18, rating: 8.0 },
  ],
  rating: [
    { rank: 1, name: 'K. Mbappé', club: 'Real Madrid', flag: '🇫🇷', emoji: '⚪', stat: '8.5', games: 30, goals: 28, assists: 12 },
    { rank: 2, name: 'K. De Bruyne', club: 'Man City', flag: '🇧🇪', emoji: '🔵', stat: '8.3', games: 28, goals: 7, assists: 13 },
    { rank: 3, name: 'E. Haaland', club: 'Man City', flag: '🇳🇴', emoji: '🟡', stat: '8.4', games: 30, goals: 35, assists: 8 },
    { rank: 4, name: 'J. Bellingham', club: 'Real Madrid', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', emoji: '⚪', stat: '8.2', games: 33, goals: 20, assists: 9 },
    { rank: 5, name: 'P. Foden', club: 'Man City', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', emoji: '🔵', stat: '8.1', games: 31, goals: 15, assists: 10 },
  ],
  motm: [
    { rank: 1, name: 'E. Haaland', club: 'Man City', flag: '🇳🇴', emoji: '🟡', stat: 14, games: 30, goals: 35, assists: 8 },
    { rank: 2, name: 'K. Mbappé', club: 'Real Madrid', flag: '🇫🇷', emoji: '⚪', stat: 12, games: 30, goals: 28, assists: 12 },
    { rank: 3, name: 'M. Salah', club: 'Liverpool', flag: '🇪🇬', emoji: '🔴', stat: 11, games: 31, goals: 22, assists: 14 },
    { rank: 4, name: 'J. Bellingham', club: 'Real Madrid', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', emoji: '⚪', stat: 10, games: 33, goals: 20, assists: 9 },
    { rank: 5, name: 'K. De Bruyne', club: 'Man City', flag: '🇧🇪', emoji: '🔵', stat: 9, games: 28, goals: 7, assists: 13 },
  ],
};

/* ==========================================
   PERFORMANCE & SEO UTILITIES
   ========================================== */

const safeHTML = (html) => window.DOMPurify ? DOMPurify.sanitize(html) : html;

async function fetchWithCache(url, options = {}, ttl = 60000) {
  const cacheKey = `PitchLive_cache_${url}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    const { timestamp, data } = JSON.parse(cached);
    if (Date.now() - timestamp < ttl) {
      return { success: true, data, cached: true };
    }
  }
  const res = await fetch(url, options);
  const json = await res.json();
  if (json.success) {
    sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: json.data }));
  }
  return json;
}

function updateSEO(title, desc, ogImage) {
  if (title) {
    document.title = title;
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = title;
  }
  if (desc) {
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = desc;
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.content = desc;
  }
  if (ogImage) {
    const ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg) ogImg.content = ogImage;
  }
}

/* ==========================================
   RENDER FUNCTIONS
   ========================================== */

function renderLiveScores(matches) {
  const grid = document.getElementById('live-scores-grid');
  if (!grid) return;
  const html = matches.map(m => {
    // Format latest event for display
    let latestEventStr = '';
    if (m.events && m.events.length > 0) {
      const latest = m.events[m.events.length - 1];
      const icon = latest.type === 'goal' ? '⚽' : (latest.type === 'yellow_card' ? '🟨' : '🔴');
      latestEventStr = `${icon} ${latest.player} ${latest.minute}'`;
    }

    return `
    <article class="score-card ${m.status === 'live' ? 'is-live' : ''}" tabindex="0" role="button" id="match-card-${m.id}" data-match-id="${m.id}" style="cursor:pointer;">
      <div class="score-card-header">
        <div class="sc-league">
          <span class="sc-league-flag">🏆</span>
          <span>${m.league}</span>
        </div>
        <span class="sc-status ${m.status}" id="match-status-${m.id}">
          ${m.status === 'live' ? `🔴 ${m.minute}'` : m.status === 'halftime' ? '⏸ HT' : m.status === 'finished' ? 'FT' : m.minute + "'"}
        </span>
      </div>
      <div class="score-card-body">
        <div class="sc-team">
          <div class="sc-crest-wrap">
            <div class="sc-crest"><img src="assets/teams/${m.home_team.crest}" alt="${m.home_team.short_name}"></div>
          </div>
          <span class="sc-team-name">${m.home_team.name}</span>
        </div>
        <div class="sc-score-center">
          <div class="sc-score-main">
            <span id="match-home-score-${m.id}">${m.home_score}</span>
            <span class="dash">–</span>
            <span id="match-away-score-${m.id}">${m.away_score}</span>
          </div>
          <div class="sc-time ${m.status === 'finished' ? 'ft-time' : ''}" id="match-time-${m.id}">
            ${m.status === 'live' ? `LIVE ${m.minute}'` : m.status === 'halftime' ? 'HALF TIME' : 'FULL TIME'}
          </div>
        </div>
        <div class="sc-team sc-team-right">
          <div class="sc-crest-wrap">
            <div class="sc-crest"><img src="assets/teams/${m.away_team.crest}" alt="${m.away_team.short_name}"></div>
          </div>
          <span class="sc-team-name">${m.away_team.name}</span>
        </div>
      </div>
      <div class="score-card-footer">
        <div class="goal-event" id="match-event-${m.id}">${latestEventStr}</div>
      </div>
    </article>
    `;
  }).join('');
  grid.innerHTML = safeHTML(html);
  
  // Attach event listeners instead of inline onclick
  grid.querySelectorAll('.score-card').forEach(card => {
    card.addEventListener('click', () => {
      window.location.href = `match.html?id=${card.dataset.matchId}`;
    });
  });

  animateIn(grid.querySelectorAll('.score-card'));
}

async function fetchFixtures() {
  const list = document.getElementById('fixtures-list');
  if (!list) return;
  
  // Loading State
  list.innerHTML = `
    <div style="display:flex; justify-content:center; padding: 40px; color: #94a3b8;">
      <div class="loader-spinner" style="border: 3px solid rgba(255,255,255,0.1); border-top-color: #22C55E; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite;"></div>
      <span style="margin-left: 15px; font-weight: 500;">Loading live fixtures...</span>
    </div>
  `;

  try {
    const res = await fetch('/api/fixtures?next=15');
    const json = await res.json();
    
    if (json.success && json.data.fixtures.length > 0) {
      renderFixtures(json.data.fixtures);
    } else {
      // Empty State
      list.innerHTML = `
        <div style="text-align:center; padding: 40px; color: #94a3b8; background: rgba(30, 41, 59, 0.4); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1);">
          <div style="font-size: 2rem; margin-bottom: 10px;">📅</div>
          <div style="font-weight: 600; font-size: 1.1rem; color: #F8FAFC;">No Fixtures Scheduled</div>
          <div style="font-size: 0.9rem; margin-top: 5px;">There are no upcoming matches available at this time.</div>
        </div>
      `;
    }
  } catch (error) {
    // Error State
    list.innerHTML = `
      <div style="text-align:center; padding: 40px; color: #ef4444; background: rgba(239, 68, 68, 0.05); border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.2);">
        <div style="font-weight: 600; font-size: 1.1rem;">Failed to load fixtures</div>
        <div style="font-size: 0.9rem; color: #fca5a5; margin-top: 5px; margin-bottom: 15px;">We couldn't reach the sports API.</div>
        <button class="btn-outline-sm" onclick="fetchFixtures()" style="border-color: rgba(239, 68, 68, 0.5); color: #ef4444;">Try Again</button>
      </div>
    `;
  }
}

function renderFixtures(fixtures) {
  const list = document.getElementById('fixtures-list');
  if (!list) return;
  const groups = {};
  fixtures.forEach(f => { if (!groups[f.date]) groups[f.date] = []; groups[f.date].push(f); });
  const html = Object.entries(groups).map(([date, matches]) => `
    <div class="fixture-group-label">${date}</div>
    ${matches.map(m => {
      // Add proper image rendering logic to prevent broken images
      const homeCrest = m.home.crest.startsWith('http') ? `<img src="${m.home.crest}" alt="${m.home.name}" style="width:24px;height:24px;object-fit:contain;">` : m.home.crest;
      const awayCrest = m.away.crest.startsWith('http') ? `<img src="${m.away.crest}" alt="${m.away.name}" style="width:24px;height:24px;object-fit:contain;">` : m.away.crest;
      
      return `
      <article class="fixture-card" tabindex="0" role="button">
        <div class="fixture-time-block">
          <span class="fixture-time">${m.time}</span>
          <span class="fixture-date-mini">${date}</span>
        </div>
        <div class="fixture-teams">
          <div class="fixture-team">
            <span class="fixture-crest">${homeCrest}</span>
            <span>${m.home.name}</span>
          </div>
          <span class="fixture-vs">VS</span>
          <div class="fixture-team right">
            <span>${m.away.name}</span>
            <span class="fixture-crest">${awayCrest}</span>
          </div>
        </div>
        <span class="fixture-league-tag">${m.league}</span>
        <button class="fixture-reminder-btn" aria-label="Set reminder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </button>
      </article>
      `
    }).join('')}
  `).join('');
  list.innerHTML = safeHTML(html);
  animateIn(list.querySelectorAll('.fixture-card'));
}

function renderStandings() {
  const table = document.getElementById('standings-table');
  if (!table) return;
  const html = `
    <div class="standings-row header">
      <span>#</span><span>Team</span><span>P</span><span>W</span><span>GD</span><span>Pts</span>
    </div>
    ${STANDINGS.map(row => `
      <div class="standings-row" tabindex="0">
        <span class="standings-pos ${row.type}">${row.pos}</span>
        <div class="standings-team">
          <span class="standings-team-crest">${row.crest}</span>
          <span>${row.team}</span>
        </div>
        <span class="standings-val">${row.p}</span>
        <span class="standings-val">${row.w}</span>
        <span class="standings-val">${row.gd}</span>
        <span class="standings-pts">${row.pts}</span>
      </div>
    `).join('')}
  `;
  table.innerHTML = safeHTML(html);
}



async function fetchAndRenderNews(category = 'all') {
  const featured = document.getElementById('news-featured');
  const sidebar = document.getElementById('news-sidebar');
  if (!featured || !sidebar) return;

  try {
    const API_URL = (typeof API_BASE !== 'undefined') ? API_BASE : (['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'http://localhost:5000/api' : '/api');
    const json = await fetchWithCache(`${API_URL}/news?category=${category}`, {}, 300000); // 5 mins cache
    
    if (json.success) {
      const { featured: fArticle, sidebar: sArticles } = json.data;

      // Render featured
      if (fArticle) {
        featured.innerHTML = safeHTML(`
          <article class="news-card featured" tabindex="0" role="button">
            <div class="news-card-img" style="background: url('${fArticle.image}') center/cover no-repeat;">
              <div class="news-card-img-overlay"></div>
            </div>
            <div class="news-card-content">
              <span class="news-card-tag">${fArticle.category}</span>
              <h3 class="news-card-title">${fArticle.title}</h3>
              <div class="news-card-meta">
                <span>${fArticle.timestamp}</span>
              </div>
            </div>
          </article>
        `);
      }

      // Render sidebar
      sidebar.innerHTML = safeHTML(`
        <div class="news-sidebar-header">
          <h3>📈 Trending</h3>
          <span class="sidebar-tag">Top Stories</span>
        </div>
        ${sArticles.map((t, i) => `
          <div class="trending-item" tabindex="0">
            <span class="trending-num">${String(i + 1).padStart(2, '0')}</span>
            <div class="trending-content">
              <div class="trending-tag">${t.category}</div>
              <div class="trending-title">${t.title}</div>
              <div class="trending-time">${t.timestamp}</div>
            </div>
          </div>
        `).join('')}
      `);
      animateIn(featured.querySelectorAll('.news-card'));
    }
  } catch (err) {
    console.error('Failed to fetch news:', err);
  }
}


function renderPlayers(statKey = 'goals') {
  const showcase = document.getElementById('players-showcase');
  if (!showcase) return;
  const players = PLAYERS[statKey];
  const statLabel = { goals: 'Goals', assists: 'Assists', rating: 'Rating', motm: 'MOTM Awards' }[statKey];
  const secStats = {
    goals: (p) => `<div class="player-mini-stat"><span>${p.assists}</span><small>Assists</small></div><div class="player-mini-stat"><span>${p.games}</span><small>Games</small></div><div class="player-mini-stat"><span>${p.rating}</span><small>Rating</small></div>`,
    assists: (p) => `<div class="player-mini-stat"><span>${p.goals}</span><small>Goals</small></div><div class="player-mini-stat"><span>${p.games}</span><small>Games</small></div><div class="player-mini-stat"><span>${p.rating}</span><small>Rating</small></div>`,
    rating: (p) => `<div class="player-mini-stat"><span>${p.goals}</span><small>Goals</small></div><div class="player-mini-stat"><span>${p.assists}</span><small>Assists</small></div><div class="player-mini-stat"><span>${p.games}</span><small>Games</small></div>`,
    motm: (p) => `<div class="player-mini-stat"><span>${p.goals}</span><small>Goals</small></div><div class="player-mini-stat"><span>${p.assists}</span><small>Assists</small></div><div class="player-mini-stat"><span>${p.games}</span><small>Games</small></div>`,
  };
  const rankClass = { 1: 'gold', 2: 'silver', 3: 'bronze' };

  showcase.innerHTML = players.map(p => `
    <article class="player-card ${p.rank === 1 ? 'rank-1' : ''}" tabindex="0" role="button">
      <div class="player-rank ${rankClass[p.rank] || ''}">${p.rank}</div>
      <span class="player-flag">${p.flag}</span>
      <div class="player-avatar">
        <div class="player-avatar-bg"></div>
        <span>${p.emoji}</span>
      </div>
      <div>
        <div class="player-name">${p.name}</div>
        <div class="player-club">${p.club}</div>
      </div>
      <div class="player-stat-main">
        <span class="player-stat-num">${p.stat}</span>
        <span class="player-stat-lbl">${statLabel}</span>
      </div>
      <div class="player-mini-stats">
        ${secStats[statKey](p)}
      </div>
    </article>
  `).join('');
  animateIn(showcase.querySelectorAll('.player-card'));
}

/* ==========================================
   ANIMATION UTILITIES
   ========================================== */

function animateIn(elements, stagger = 80) {
  elements.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'none';
    setTimeout(() => {
      el.style.transition = `opacity 0.45s ease, transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)`;
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, i * stagger + 50);
  });
}

function animateCountUp(el) {
  const target = parseInt(el.dataset.count);
  const duration = 1800;
  const start = performance.now();
  const format = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
    return n.toString();
  };
  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    el.textContent = format(Math.round(eased * target));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ==========================================
   NAVBAR
   ========================================== */

const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
const navLinks = document.querySelectorAll('.nav-link');
const searchBtn = document.getElementById('nav-search-btn');
const searchOverlay = document.getElementById('search-overlay');
const searchClose = document.getElementById('search-close');
const searchInput = document.getElementById('global-search-input'); // Fixed ID mismatch

// Scroll effect
window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}, { passive: true });

// Hamburger
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});

// Mobile links
document.querySelectorAll('.mobile-nav-link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
  });
});

// Search
searchBtn.addEventListener('click', () => {
  searchOverlay.classList.add('active');
  setTimeout(() => { if (searchInput) searchInput.focus(); }, 100);
});
searchClose.addEventListener('click', () => searchOverlay.classList.remove('active'));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') searchOverlay.classList.remove('active');
});

// Active nav link on scroll
const sections = document.querySelectorAll('section[id]');
const observerNav = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(l => {
        l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id);
      });
    }
  });
}, { threshold: 0.4 });
sections.forEach(s => observerNav.observe(s));


/* ==========================================
   HERO STATS COUNT-UP
   ========================================== */

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.stat-value[data-count]').forEach(el => {
        animateCountUp(el);
        el.removeAttribute('data-count');
      });
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

const heroSection = document.getElementById('hero');
if (heroSection) statsObserver.observe(heroSection);

/* ==========================================
   DATE NAV
   ========================================== */

const dates = ['Yesterday', 'Today', 'Tomorrow', 'Thu', 'Fri', 'Sat'];
let currentDateIdx = 1;
const dateDisplay = document.getElementById('current-date');

document.getElementById('prev-date')?.addEventListener('click', () => {
  currentDateIdx = Math.max(0, currentDateIdx - 1);
  dateDisplay.textContent = dates[currentDateIdx];
  renderLiveScores(LIVE_MATCHES);
});
document.getElementById('next-date')?.addEventListener('click', () => {
  currentDateIdx = Math.min(dates.length - 1, currentDateIdx + 1);
  dateDisplay.textContent = dates[currentDateIdx];
  renderLiveScores(LIVE_MATCHES);
});

/* ==========================================
   LEAGUE FILTERS
   ========================================== */

document.querySelectorAll('.filter-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    renderLeagues(pill.dataset.filter);
  });
});

/* ==========================================
   NEWS FILTER TABS
   ========================================== */

document.querySelectorAll('.news-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.news-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    fetchAndRenderNews(tab.dataset.category);
  });
});

/* ==========================================
   PLAYER STAT TABS
   ========================================== */

document.querySelectorAll('.player-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.player-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    renderPlayers(tab.dataset.stat);
  });
});

/* ==========================================
   INTERSECTION OBSERVER (Section Animations)
   ========================================== */

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      sectionObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.section').forEach(s => sectionObserver.observe(s));

/* ==========================================
   LIVE SCORE UPDATES (Socket.IO)
   ========================================== */

function setupRealTime() {
  // Use the API_BASE if defined globally (from auth.js), else default to localhost:5000
  const API_URL = (typeof API_BASE !== 'undefined') ? API_BASE.replace('/api', '') : (['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'http://localhost:5000' : '');
  
  if (typeof io === 'undefined') {
    console.warn('Socket.io not loaded.');
    return;
  }
  
  window.appSocket = io(API_URL);

  window.appSocket.on('connect', () => {
    console.log('🔌 Connected to live sports server');
    window.appSocket.emit('join_live_scores');

    // Re-authenticate socket if user is logged in
    const token = window.TokenStorage ? window.TokenStorage.getAccessToken() : localStorage.getItem('token');
    if (token) window.appSocket.emit('authenticate', token);
  });

  window.appSocket.on('minute_tick', (data) => {
    const { matchId, minute } = data;
    const match = LIVE_MATCHES.find(m => m.id === matchId);
    if (match) match.minute = minute;
    
    const statusEl = document.getElementById(`match-status-${matchId}`);
    const timeEl = document.getElementById(`match-time-${matchId}`);
    if (statusEl) statusEl.textContent = `🔴 ${minute}'`;
    if (timeEl) timeEl.textContent = `LIVE ${minute}'`;
  });

  window.appSocket.on('score_update', (data) => {
    const { matchId, home_score, away_score, event } = data;
    const match = LIVE_MATCHES.find(m => m.id === matchId);
    if (match) {
      match.home_score = home_score;
      match.away_score = away_score;
      if (event) match.events.push(event);
    }

    const homeEl = document.getElementById(`match-home-score-${matchId}`);
    const awayEl = document.getElementById(`match-away-score-${matchId}`);
    const eventEl = document.getElementById(`match-event-${matchId}`);
    
    if (homeEl) {
      homeEl.textContent = home_score;
      homeEl.parentElement.classList.add('flash');
      setTimeout(() => homeEl.parentElement.classList.remove('flash'), 1000);
    }
    if (awayEl) {
      awayEl.textContent = away_score;
    }
    if (eventEl && event) {
      eventEl.textContent = `⚽ ${event.player} ${event.minute}'`;
      eventEl.classList.add('flash');
      setTimeout(() => eventEl.classList.remove('flash'), 1000);
    }
  });

  window.appSocket.on('match_event', (data) => {
    const { matchId, event } = data;
    const match = LIVE_MATCHES.find(m => m.id === matchId);
    if (match) match.events.push(event);
    
    const eventEl = document.getElementById(`match-event-${matchId}`);
    if (eventEl) {
      const icon = event.type === 'yellow_card' ? '🟨' : '🔴';
      eventEl.textContent = `${icon} ${event.player} ${event.minute}'`;
    }
  });

  window.appSocket.on('match_status_change', (data) => {
    const { matchId, status, minute } = data;
    const match = LIVE_MATCHES.find(m => m.id === matchId);
    if (match) {
      match.status = status;
      if (minute) match.minute = minute;
    }
    
    const statusEl = document.getElementById(`match-status-${matchId}`);
    const timeEl = document.getElementById(`match-time-${matchId}`);
    const cardEl = document.getElementById(`match-card-${matchId}`);
    
    if (statusEl) {
      statusEl.textContent = status === 'live' ? `🔴 ${minute}'` : status === 'halftime' ? '⏸ HT' : 'FT';
      statusEl.className = `sc-status ${status}`;
    }
    if (timeEl) {
      timeEl.textContent = status === 'live' ? `LIVE ${minute}'` : status === 'halftime' ? 'HALF TIME' : 'FULL TIME';
      if (status === 'finished') timeEl.classList.add('ft-time');
      else timeEl.classList.remove('ft-time');
    }
    if (cardEl) {
      if (status === 'live') cardEl.classList.add('is-live');
      else cardEl.classList.remove('is-live');
    }
  });

  // Chat message listener
  window.appSocket.on('new_chat_message', (msg) => {
    appendChatMessage(msg);
  });

  window.appSocket.on('chat_error', (data) => {
    alert(data.message);
  });
}

/* ==========================================
   RIPPLE EFFECT
   ========================================== */

function createRipple(e) {
  const btn = e.currentTarget;
  const circle = document.createElement('span');
  const diameter = Math.max(btn.clientWidth, btn.clientHeight);
  const radius = diameter / 2;
  const rect = btn.getBoundingClientRect();
  circle.style.cssText = `
    width: ${diameter}px; height: ${diameter}px;
    left: ${e.clientX - rect.left - radius}px;
    top: ${e.clientY - rect.top - radius}px;
    position: absolute; border-radius: 50%;
    transform: scale(0); animation: ripple 0.6s linear;
    background: rgba(255,255,255,0.2); pointer-events: none;
  `;
  const style = document.createElement('style');
  style.textContent = `@keyframes ripple { to { transform: scale(4); opacity: 0; } }`;
  document.head.appendChild(style);
  btn.style.position = 'relative';
  btn.style.overflow = 'hidden';
  btn.appendChild(circle);
  setTimeout(() => circle.remove(), 700);
}

document.querySelectorAll('.btn-primary').forEach(btn => btn.addEventListener('click', createRipple));

/* ==========================================
   SUGGESTION TAGS
   ========================================== */

document.querySelectorAll('.suggestion-tag').forEach(tag => {
  tag.addEventListener('click', () => {
    searchInput.value = tag.textContent;
    searchInput.focus();
  });
});

/* ==========================================
   REMINDER BUTTONS
   ========================================== */

document.addEventListener('click', (e) => {
  if (e.target.closest('.fixture-reminder-btn')) {
    const btn = e.target.closest('.fixture-reminder-btn');
    btn.style.color = 'var(--accent)';
    btn.style.borderColor = 'var(--accent)';
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="var(--accent)" stroke="var(--accent)" stroke-width="2" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>`;
    btn.disabled = true;
  }
});

/* ==========================================
   INIT
   ========================================== */

async function fetchLiveMatches() {
  try {
    const API_URL = window.location.hostname === 'localhost' ? (['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'http://localhost:5000/api' : '/api') : '/api';
    const json = await fetchWithCache(`${API_URL}/matches/live`, {}, 15000); // 15 sec cache for live scores
    if (json.success) {
      LIVE_MATCHES = json.data.matches;
      renderLiveScores(LIVE_MATCHES);
    }
  } catch (err) {
    console.error('Failed to fetch live matches:', err);
  }
}

let currentWatchMatchId = null;

function initWatchModal() {
  const overlay = document.getElementById('watch-modal-overlay');
  const closeBtn = document.getElementById('close-watch-modal');
  const chatForm = document.getElementById('chat-form');
  
  if (!overlay || !closeBtn) return;

  const closeMod = () => {
    overlay.classList.remove('active');
    if (currentWatchMatchId && window.appSocket) {
      window.appSocket.emit('leave_match', currentWatchMatchId);
    }
    currentWatchMatchId = null;
  };

  closeBtn.addEventListener('click', closeMod);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeMod();
  });

  // Attach click listener to the live matches container using event delegation
  const liveGrid = document.getElementById('live-scores-grid');
  if (liveGrid) {
    liveGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.score-card');
      if (card && card.id.startsWith('match-card-')) {
        const matchId = card.id.replace('match-card-', '');
        const homeName = card.querySelector('.sc-team:not(.sc-team-right) .sc-team-name').textContent;
        const awayName = card.querySelector('.sc-team-right .sc-team-name').textContent;
        openWatchModal(matchId, `${homeName} vs ${awayName}`);
      }
    });
  }

  // Handle chat submission
  if (chatForm) {
    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('chat-input');
      const val = input.value.trim();
      if (!val || !currentWatchMatchId || !window.appSocket) return;

      const user = window.AuthManager ? await window.AuthManager.getUser() : null;
      if (!user) {
        alert('You must be logged in to chat.');
        return;
      }

      window.appSocket.emit('chat_message', {
        matchId: currentWatchMatchId,
        content: val,
        user: { display_name: user.display_name, username: user.username, avatar_url: user.avatar_url }
      });
      input.value = '';
    });
  }
}

async function openWatchModal(matchId, matchTitle) {
  currentWatchMatchId = matchId;
  const overlay = document.getElementById('watch-modal-overlay');
  const titleEl = document.getElementById('watch-modal-title');
  const listEl = document.getElementById('streams-list');
  const chatContainer = document.getElementById('watch-chat-container');
  const chatMessages = document.getElementById('chat-messages');
  
  titleEl.textContent = matchTitle || 'Live Match';
  listEl.innerHTML = `<div class="skeleton skeleton-card" style="height:60px; margin-bottom:10px;"></div><div class="skeleton skeleton-card" style="height:60px;"></div>`;
  chatContainer.style.display = 'none';
  chatMessages.innerHTML = `<div class="skeleton skeleton-text long"></div><div class="skeleton skeleton-text short"></div>`;
  
  overlay.classList.add('active');

  // Join socket room
  if (window.appSocket) {
    window.appSocket.emit('join_match', matchId);
  }

  // AUTH GATE
  const token = window.TokenStorage ? window.TokenStorage.getAccessToken() : localStorage.getItem('token');
  if (!token) {
    listEl.innerHTML = `
      <div class="watch-auth-gate">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <h3 style="font-family:'Outfit'; font-size:1.2rem; margin-bottom:5px;">Sign In to Watch</h3>
        <p style="color:var(--muted); font-size:0.9rem; margin-bottom:20px;">Premium streaming links and live chat are reserved for registered users.</p>
        <button class="btn-primary" onclick="window.location.href='auth/login.html'" style="display:inline-block;">Create Free Account</button>
      </div>
    `;
    return;
  }

  // User is logged in, show chat
  chatContainer.style.display = 'flex';

  // FETCH STREAMS & CHAT HISTORY
  const API_URL = (typeof API_BASE !== 'undefined') ? API_BASE : (['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'http://localhost:5000/api' : '/api');
  
  try {
    const [streamRes, chatRes] = await Promise.all([
      fetch(`${API_URL}/streams/${matchId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_URL}/chat/${matchId}/history`, { headers: { 'Authorization': `Bearer ${token}` } })
    ]);
    
    const streamJson = await streamRes.json();
    const chatJson = await chatRes.json();
    
    if (streamJson.success && streamJson.data.length > 0) {
      listEl.innerHTML = streamJson.data.map(stream => `
        <a href="${stream.url}" target="_blank" rel="noopener noreferrer" class="stream-btn">
          <div class="stream-info">
            <div class="stream-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
            <div>
              <div style="font-size: 0.95rem;">${stream.source_name}</div>
              <div style="font-size: 0.75rem; color: var(--success); font-weight: 500; margin-top: 2px;">● Online</div>
            </div>
          </div>
          <div class="stream-lang">${stream.language}</div>
        </a>
      `).join('');
    } else {
      listEl.innerHTML = `
        <div class="empty-state" style="padding: 30px 10px;">
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h4l2-9 5 18 3-10h6"/></svg>
          <div class="empty-state-title" style="font-size:1.1rem;">No Streams Available</div>
          <div class="empty-state-desc" style="font-size:0.85rem;">We couldn't find any active streams for this match yet. Check back closer to kickoff.</div>
        </div>
      `;
    }

    if (chatJson.success) {
      chatMessages.innerHTML = '';
      if (chatJson.data.length === 0) {
        chatMessages.innerHTML = `<div style="text-align:center; color:var(--muted); margin-top:20px; font-size:0.85rem;">Be the first to send a message!</div>`;
      } else {
        chatJson.data.forEach(msg => appendChatMessage(msg, false));
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }
  } catch (err) {
    console.error(err);
    listEl.innerHTML = `<div style="color:#ef4444; padding:20px; text-align:center;">Failed to load resources.</div>`;
    chatMessages.innerHTML = `<div style="color:#ef4444; text-align:center;">Chat unavailable.</div>`;
  }
}

function appendChatMessage(msg, autoScroll = true) {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  // Clear empty state if needed
  if (container.innerHTML.includes('Be the first')) container.innerHTML = '';

  const initial = (msg.display_name || msg.username || '?').charAt(0).toUpperCase();

  const msgHtml = safeHTML(`
    <div class="chat-msg">
      <div class="chat-msg-avatar">${initial}</div>
      <div class="chat-msg-content">
        <div class="chat-msg-name">${msg.display_name || msg.username}</div>
        <div class="chat-msg-text">${escapeHtml(msg.content)}</div>
      </div>
    </div>
  `);
  container.insertAdjacentHTML('beforeend', msgHtml);

  if (autoScroll) {
    container.scrollTop = container.scrollHeight;
  }
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


async function init() {
  try {
    const API_URL = window.location.hostname === 'localhost' ? (['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'http://localhost:5000/api' : '/api') : '/api';
    
    // Fetch league data (Premier League defaults)
    const leagueRes = await fetchWithCache(`${API_URL}/leagues/PL`, {}, 300000); // 5 mins cache
    if (leagueRes.success && leagueRes.data) {
      const { standings, top_scorers, top_assists } = leagueRes.data;
      
      // Update STANDINGS globally
      if (standings && standings.length > 0) {
        STANDINGS = standings.map(s => ({
          pos: s.pos, team: s.team, crest: s.crest ? `<img src="${s.crest}" alt="${s.team}" style="width:20px;height:20px;">` : '⚽', 
          p: s.pld, w: s.w, d: s.d, l: s.l, gd: s.gd, pts: s.pts, form: s.form, 
          type: s.pos <= 4 ? 'cl' : (s.pos >= 18 ? 'rel' : '')
        }));
      }

      // Update PLAYERS globally
      if (top_scorers && top_scorers.length > 0) {
        PLAYERS.goals = top_scorers.map(p => ({
          rank: p.rank, name: p.player, club: p.team, flag: '', emoji: p.photo ? `<img src="${p.photo}" alt="${p.player}" style="width:30px; border-radius:50%;">` : '⚽',
          stat: p.goals, games: p.matches, assists: 0, rating: 0
        }));
      }
      
      if (top_assists && top_assists.length > 0) {
        PLAYERS.assists = top_assists.map(p => ({
          rank: p.rank, name: p.player, club: p.team, flag: '', emoji: p.photo ? `<img src="${p.photo}" alt="${p.player}" style="width:30px; border-radius:50%;">` : '⚽',
          stat: p.assists, games: p.matches, goals: 0, rating: 0
        }));
      }
    }

  } catch (err) {
    console.error('Failed to initialize API data', err);
  }

  fetchLiveMatches().then(() => setupRealTime());
  
  fetchFixtures();
  renderStandings();
  fetchAndRenderNews();
  renderPlayers();
  initWatchModal();

  // Suggestion chips animation
  document.querySelectorAll('.suggestion-tag').forEach((el, i) => {
    el.style.animationDelay = `${i * 60}ms`;
  });
}

document.addEventListener('DOMContentLoaded', init);

