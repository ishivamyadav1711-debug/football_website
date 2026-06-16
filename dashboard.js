document.addEventListener('DOMContentLoaded', async () => {
  const API_URL = (typeof API_BASE !== 'undefined') ? API_BASE : 'http://localhost:5000/api';
  
  // Requires auth
  const token = localStorage.getItem('accessToken');
  if (!token) {
    window.location.href = 'auth/login.html';
    return;
  }

  // Fetch user profile
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    if (json.success) {
      document.getElementById('dash-username').textContent = json.data.user.display_name || json.data.user.username;
    } else {
      window.location.href = 'auth/login.html';
    }
  } catch (err) {
    console.error(err);
  }

  // Fetch favorites
  try {
    const res = await fetch(`${API_URL}/favorites`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    
    const grid = document.getElementById('favorites-grid');
    if (json.success && json.data.favorites.length > 0) {
      grid.innerHTML = json.data.favorites.map(f => `
        <a href="${f.url}" class="fav-card">
          <img src="${f.image}" alt="${f.name}">
          <strong>${f.name}</strong>
          <span class="fav-card-type">${f.type}</span>
        </a>
      `).join('');
    } else {
      grid.innerHTML = '<div style="color:var(--muted); font-size:0.9rem;">You haven\'t added any favorites yet. Explore the site to add some!</div>';
    }
  } catch (err) {
    console.error(err);
  }
});
