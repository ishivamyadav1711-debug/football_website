let playerData = null;

// Get Player ID from URL
const urlParams = new URLSearchParams(window.location.search);
const playerId = urlParams.get('id') || '107'; // Default to Saka

const API_URL = (typeof API_BASE !== 'undefined') ? API_BASE : 'http://localhost:5000/api';

// Chart Theme Colors
const COLORS = {
  primary: '#0F172A',
  accent: '#22C55E',
  accentAlpha: 'rgba(34, 197, 94, 0.2)',
  text: '#F8FAFC',
  muted: '#94A3B8',
  grid: 'rgba(255, 255, 255, 0.05)',
  secondaryAccent: '#3B82F6'
};

// Global Chart.js defaults for dark theme
Chart.defaults.color = COLORS.muted;
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.scale.grid.color = COLORS.grid;

async function fetchPlayerDetails() {
  try {
    const isApi = urlParams.get('api') === 'true';
    const res = await fetch(`${API_URL}/players/${playerId}?api=${isApi}`);
    const json = await res.json();
    if (json.success) {
      playerData = json.data.player;
      renderBio();
      renderStatsRibbon();
      initCharts();
    } else {
      throw new Error(json.message);
    }
  } catch (err) {
    console.error('Failed to fetch player details:', err);
    document.getElementById('player-name').textContent = 'Player Not Found';
  }
}

function renderBio() {
  const p = playerData;
  document.getElementById('player-name').textContent = p.name;
  document.getElementById('market-value').textContent = p.market_value;
  document.getElementById('player-bg').style.backgroundImage = `url('${p.hero_image}')`;
  document.getElementById('player-cutout-img').src = p.image;

  document.getElementById('player-badges').innerHTML = `
    <div class="player-badge">
      <img src="${p.team_logo}" alt="Club">
      ${p.team_name}
    </div>
    <div class="player-badge">
      ${p.flag} ${p.nationality}
    </div>
    <div class="player-badge">
      🎯 ${p.position}
    </div>
    <div class="player-badge">
      🎂 Age ${p.age}
    </div>
  `;
}

function renderStatsRibbon() {
  const s = playerData.current_season;
  document.getElementById('stats-ribbon').innerHTML = `
    <div class="ribbon-stat">
      <div class="ribbon-val">${s.goals}</div>
      <div class="ribbon-label">Goals</div>
    </div>
    <div class="ribbon-stat">
      <div class="ribbon-val">${s.assists}</div>
      <div class="ribbon-label">Assists</div>
    </div>
    <div class="ribbon-stat">
      <div class="ribbon-val">${s.matches}</div>
      <div class="ribbon-label">Matches</div>
    </div>
    <div class="ribbon-stat">
      <div class="ribbon-val">${s.minutes}</div>
      <div class="ribbon-label">Minutes</div>
    </div>
  `;
}

function initCharts() {
  renderRadarChart();
  renderBarChart();
  renderLineChart();
}

function renderRadarChart() {
  const ctx = document.getElementById('radarChart').getContext('2d');
  const labels = playerData.attributes.map(a => a.subject);
  const data = playerData.attributes.map(a => a.A);

  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Attributes',
        data: data,
        backgroundColor: COLORS.accentAlpha,
        borderColor: COLORS.accent,
        pointBackgroundColor: COLORS.accent,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: COLORS.accent,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          angleLines: { color: COLORS.grid },
          grid: { color: COLORS.grid },
          pointLabels: { color: COLORS.text, font: { size: 12, weight: 'bold' } },
          ticks: { display: false, min: 0, max: 100 }
        }
      },
      plugins: { legend: { display: false } }
    }
  });
}

function renderBarChart() {
  const ctx = document.getElementById('barChart').getContext('2d');
  const sc = playerData.seasonal_comparison;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sc.labels,
      datasets: [
        {
          label: 'Goals',
          data: sc.goals,
          backgroundColor: COLORS.accent,
          borderRadius: 6
        },
        {
          label: 'Expected Goals (xG)',
          data: sc.xg,
          backgroundColor: COLORS.grid, // subtle gray
          borderColor: COLORS.muted,
          borderWidth: 1,
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: COLORS.text } }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function renderLineChart() {
  const ctx = document.getElementById('lineChart').getContext('2d');
  const cp = playerData.career_progression;

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: cp.labels,
      datasets: [
        {
          label: 'Market Value (€M)',
          data: cp.market_value,
          borderColor: COLORS.accent,
          backgroundColor: COLORS.accentAlpha,
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          yAxisID: 'y'
        },
        {
          label: 'Goal Contributions',
          data: cp.goal_contributions,
          borderColor: COLORS.secondaryAccent,
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderWidth: 3,
          tension: 0.4,
          borderDash: [5, 5],
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { labels: { color: COLORS.text } } },
      scales: {
        x: { grid: { display: false } },
        y: {
          type: 'linear', display: true, position: 'left',
          title: { display: true, text: 'Value (€M)', color: COLORS.muted }
        },
        y1: {
          type: 'linear', display: true, position: 'right',
          grid: { drawOnChartArea: false }, // only draw grid lines for one axis
          title: { display: true, text: 'Contributions', color: COLORS.muted }
        }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', fetchPlayerDetails);
