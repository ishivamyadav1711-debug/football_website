// Global Search Initialization
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('global-search-input');
  const resultsContainer = document.getElementById('search-results');
  
  if (!searchInput || !resultsContainer) return;

  const SEARCH_API = (typeof API_BASE !== 'undefined' ? API_BASE : (['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'http://localhost:5000/api' : '/api')) + '/search';
  let timeoutId;

  // Make resultsContainer act like the dropdown for search.css
  resultsContainer.classList.add('search-dropdown');
  // It needs relative positioning to show up nicely under the input in the overlay, or we rely on the search.css
  // Actually, search.css absolute positions .search-dropdown. Let's just use it.

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    
    clearTimeout(timeoutId);

    if (query.length === 0) {
      resultsContainer.classList.remove('active');
      return;
    }

    // Debounce
    timeoutId = setTimeout(() => {
      fetchSearchResults(query);
    }, 300);
  });

  // Hide on click outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
      resultsContainer.classList.remove('active');
    }
  });

  async function fetchSearchResults(query) {
    try {
      const res = await fetch(`${SEARCH_API}?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      
      if (json.success) {
        renderDropdown(json.data.results);
      }
    } catch (err) {
      console.error('Search failed:', err);
    }
  }

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      if (query.length > 0) {
        window.location.href = `search.html?q=${encodeURIComponent(query)}`;
      }
    }
  });

  function renderDropdown(results) {
    const query = searchInput.value.trim();
    if (!results || results.length === 0) {
      resultsContainer.innerHTML = '<div class="search-no-results">No results found</div>';
    } else {
      let html = results.slice(0, 5).map(r => `
        <a href="${r.url}" class="search-result-item">
          <img src="${r.image}" class="search-result-img" alt="${r.name}" onerror="this.src='https://cdn.sportmonks.com/images/soccer/placeholder.png'">
          <div class="search-result-info">
            <span class="search-result-name">${r.name}</span>
            <span class="search-result-sub">${r.type} • ${r.subtitle}</span>
          </div>
        </a>
      `).join('');
      
      html += `
        <a href="search.html?q=${encodeURIComponent(query)}" class="search-result-item" style="justify-content: center; background: rgba(34, 197, 94, 0.1); border-top: 1px solid var(--border);">
          <span style="color: var(--accent); font-weight: 600; font-size: 0.9rem;">View all results for "${query}"</span>
        </a>
      `;
      
      resultsContainer.innerHTML = html;
    }
    
    resultsContainer.classList.add('active');
  }
});
