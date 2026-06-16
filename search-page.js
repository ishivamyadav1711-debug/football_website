document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const query = params.get('q') || '';
  
  document.getElementById('search-title').textContent = `Results for "${query}"`;
  
  if (!query) {
    document.getElementById('search-subtitle').textContent = 'Please enter a search term.';
    return;
  }

  const API_URL = typeof API_BASE !== 'undefined' ? API_BASE : (['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'http://localhost:5000/api' : '/api');
  let globalResults = [];

  // Tab switching logic
  const tabs = document.querySelectorAll('.league-tab');
  const sections = document.querySelectorAll('.tab-section');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
  });

  async function fetchResults() {
    try {
      const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      
      if (json.success) {
        globalResults = json.data.results;
        document.getElementById('search-subtitle').textContent = `${globalResults.length} matches found`;
        renderResults();
      } else {
        document.getElementById('search-subtitle').textContent = 'Failed to load results.';
      }
    } catch (err) {
      console.error('Search failed:', err);
      document.getElementById('search-subtitle').textContent = 'Error connecting to search service.';
    }
  }

  function renderResults() {
    const players = globalResults.filter(r => r.type === 'player');
    const teams = globalResults.filter(r => r.type === 'team');
    const leagues = globalResults.filter(r => r.type === 'league');

    renderGrid('all-container', globalResults);
    renderGrid('players-container', players);
    renderGrid('teams-container', teams);
    renderGrid('leagues-container', leagues);
  }

  function renderGrid(containerId, results) {
    const container = document.getElementById(containerId);
    
    if (results.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          <div class="empty-state-title">No results found</div>
        </div>`;
      return;
    }

    container.innerHTML = results.map(r => `
      <article class="league-card" role="button" tabindex="0" onclick="window.location.href='${r.url}'">
        <div class="league-card-emblem" style="background: transparent; border: none; overflow: hidden;">
          <img src="${r.image}" alt="${r.name}" style="width: 100%; height: 100%; object-fit: contain; border-radius: ${r.type === 'player' ? '50%' : '0'}" onerror="this.src='https://cdn.sportmonks.com/images/soccer/placeholder.png'">
        </div>
        <div class="league-card-name">${r.name}</div>
        <div class="league-card-country" style="text-transform: capitalize;">${r.type} • ${r.subtitle}</div>
      </article>
    `).join('');
  }

  fetchResults();
});
