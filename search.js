// Global Search Initialization
document.addEventListener('DOMContentLoaded', () => {
  const navContainer = document.querySelector('.nav-container');
  if (!navContainer) return;

  // Search DOM Structure
  const searchHtml = `
    <div class="global-search">
      <div class="search-input-wrap">
        <span class="search-icon">🔍</span>
        <input type="text" id="global-search-input" placeholder="Search teams, players, leagues..." autocomplete="off">
      </div>
      <div class="search-dropdown" id="search-dropdown"></div>
    </div>
  `;

  // Inject after logo but before nav-links or auth container
  const logo = navContainer.querySelector('.logo');
  if (logo) {
    logo.insertAdjacentHTML('afterend', searchHtml);
  } else {
    navContainer.insertAdjacentHTML('afterbegin', searchHtml);
  }

  // Search Logic
  const searchInput = document.getElementById('global-search-input');
  const dropdown = document.getElementById('search-dropdown');
  const SEARCH_API = (typeof API_BASE !== 'undefined' ? API_BASE : 'http://localhost:5000/api') + '/search';
  let timeoutId;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    
    clearTimeout(timeoutId);

    if (query.length === 0) {
      dropdown.classList.remove('active');
      return;
    }

    // Debounce
    timeoutId = setTimeout(() => {
      fetchSearchResults(query);
    }, 300);
  });

  // Hide dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.global-search')) {
      dropdown.classList.remove('active');
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

  function renderDropdown(results) {
    dropdown.innerHTML = '';
    
    if (results.length === 0) {
      dropdown.innerHTML = '<div class="search-no-results">No results found</div>';
    } else {
      dropdown.innerHTML = results.slice(0, 5).map(r => `
        <a href="${r.url}" class="search-result-item">
          <img src="${r.image}" class="search-result-img" alt="${r.name}" onerror="this.src='https://cdn.sportmonks.com/images/soccer/placeholder.png'">
          <div class="search-result-info">
            <span class="search-result-name">${r.name}</span>
            <span class="search-result-sub">${r.type} • ${r.subtitle}</span>
          </div>
        </a>
      `).join('');
    }
    
    dropdown.classList.add('active');
  }
});
