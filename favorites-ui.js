// favorites-ui.js
document.addEventListener('DOMContentLoaded', () => {
  const API_URL = (typeof API_BASE !== 'undefined') ? API_BASE : (['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'http://localhost:5000/api' : '/api');
  
  // Create Favorite Button
  const btn = document.createElement('button');
  btn.className = 'favorite-btn';
  btn.innerHTML = '⭐ Add to Favorites';
  btn.style.cssText = `
    padding: 10px 20px;
    border-radius: 12px;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    color: white;
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
    font-weight: 600;
    transition: all 0.3s;
    backdrop-filter: blur(10px);
    margin-top: 15px;
  `;

  // Determine entity type and ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  let entityType = '';
  let entityId = urlParams.get('id');

  if (window.location.pathname.includes('team.html')) entityType = 'team';
  if (window.location.pathname.includes('player.html')) entityType = 'player';
  if (window.location.pathname.includes('league.html')) entityType = 'league';

  if (!entityType || !entityId) return;

  // Check auth
  const token = localStorage.getItem('accessToken');
  if (!token) {
    btn.innerHTML = '🔒 Login to Favorite';
    btn.onclick = () => window.location.href = 'auth/login.html';
  } else {
    btn.onclick = toggleFavorite;
  }

  // Inject into Hero
  const injectionTarget = document.querySelector('.team-info-panel, .player-info-panel, .league-hero-content > div:last-child');
  if (injectionTarget) {
    injectionTarget.appendChild(btn);
  }

  let isFavorited = false;

  async function toggleFavorite() {
    if (btn.disabled) return;
    btn.disabled = true;

    try {
      const method = isFavorited ? 'DELETE' : 'POST';
      const res = await fetch(`${API_URL}/favorites`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ entityType, entityId })
      });

      const json = await res.json();
      if (json.success) {
        isFavorited = !isFavorited;
        updateBtnState();
      } else {
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      btn.disabled = false;
    }
  }

  function updateBtnState() {
    if (isFavorited) {
      btn.innerHTML = '⭐ Favorited';
      btn.style.background = 'rgba(34,197,94,0.2)';
      btn.style.borderColor = '#22C55E';
      btn.style.color = '#22C55E';
    } else {
      btn.innerHTML = '⭐ Add to Favorites';
      btn.style.background = 'rgba(255,255,255,0.1)';
      btn.style.borderColor = 'rgba(255,255,255,0.2)';
      btn.style.color = 'white';
    }
  }
});
