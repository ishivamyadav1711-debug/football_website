const API_URL = (typeof API_BASE !== 'undefined') ? API_BASE : (['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'http://localhost:5000/api' : '/api');

class AdminDashboard {
  constructor() {
    this.token = localStorage.getItem('token');
    this.initNavigation();
    this.initDashboard();
    this.initUsers();
    this.initNotifications();
    this.initStreams();
    this.initLogout();
  }

  // --- Utility ---
  async fetchSecure(endpoint, options = {}) {
    const res = await fetch(`${API_URL}/admin${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    if (res.status === 401 || res.status === 403) {
      alert('Security violation. Redirecting.');
      window.location.href = '/index.html';
    }
    return res.json();
  }

  // --- Navigation ---
  initNavigation() {
    const links = document.querySelectorAll('.sidebar-nav .nav-item');
    const views = document.querySelectorAll('.admin-view');

    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        
        links.forEach(l => l.classList.remove('active'));
        views.forEach(v => v.classList.remove('active'));

        link.classList.add('active');
        document.getElementById(link.getAttribute('data-target')).classList.add('active');
      });
    });
  }

  // --- Dashboard Analytics ---
  async initDashboard() {
    try {
      const data = await this.fetchSecure('/stats');
      if (data.success) {
        const { metrics, popular } = data.data;
        
        // Update top cards
        document.getElementById('val-users').textContent = metrics.active_users.toLocaleString();
        document.getElementById('val-revenue').textContent = `$${metrics.revenue.toLocaleString()}`;
        document.getElementById('val-traffic').textContent = metrics.traffic.toLocaleString();
        document.getElementById('val-conversion').textContent = `${metrics.conversion_rate}%`;

        // Render popular table
        const tbody = document.querySelector('#popular-table tbody');
        tbody.innerHTML = popular.map(row => `
          <tr>
            <td><span class="badge" style="background: rgba(255,255,255,0.1); color: #fff;">${row.entity_type.toUpperCase()}</span></td>
            <td style="font-family: monospace;">${row.entity_id}</td>
            <td style="font-weight: 600;">${row.followers}</td>
          </tr>
        `).join('');

        this.renderChart();
      }
    } catch (err) {
      console.error(err);
    }
  }

  renderChart() {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    
    // Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Simulated MRR ($)',
          data: [1200, 1900, 3000, 5000, 6200, 8500],
          borderColor: '#3b82f6',
          backgroundColor: gradient,
          borderWidth: 3,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, border: { dash: [4, 4] } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // --- User Management ---
  async initUsers() {
    try {
      const data = await this.fetchSecure('/users');
      if (data.success) {
        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = data.data.users.map(u => `
          <tr>
            <td style="font-family: monospace; font-size: 0.8rem; color: var(--text-muted);">${u.id.substring(0,8)}...</td>
            <td style="font-weight: 600;">${u.username}</td>
            <td>${u.email}</td>
            <td><span class="badge ${u.role}">${u.role}</span></td>
            <td>${u.email_verified ? '<span class="badge verified">Verified</span>' : '<span class="badge" style="background: rgba(239, 68, 68, 0.2); color: #ef4444;">Unverified</span>'}</td>
            <td>
              <select onchange="window.adminApp.updateRole('${u.id}', this.value)" style="background: var(--bg-dark); color: #fff; border: 1px solid var(--border); padding: 4px; border-radius: 4px;">
                <option value="user" ${u.role === 'user' ? 'selected' : ''}>User</option>
                <option value="moderator" ${u.role === 'moderator' ? 'selected' : ''}>Moderator</option>
                <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
              </select>
            </td>
          </tr>
        `).join('');
      }
    } catch (err) {
      console.error(err);
    }
  }

  async updateRole(userId, newRole) {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`)) {
      this.initUsers(); // reset select
      return;
    }
    
    try {
      const data = await this.fetchSecure(`/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      });
      if (data.success) {
        this.initUsers();
      }
    } catch (err) {
      console.error(err);
    }
  }

  // --- Notifications Broadcast ---
  initNotifications() {
    document.getElementById('send-push-btn').addEventListener('click', async () => {
      const entityType = document.getElementById('notif-entity-type').value;
      const entityId = document.getElementById('notif-entity-id').value;
      const type = document.getElementById('notif-type').value;
      const title = document.getElementById('notif-title').value;
      const message = document.getElementById('notif-message').value;

      if (!entityId || !title || !message) {
        alert('Please fill out all fields.');
        return;
      }

      try {
        const res = await fetch(`${API_URL}/notifications/trigger`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ entityType, entityId, type, title, message })
        });
        const json = await res.json();
        if (json.success) {
          alert('Notification broadcasted successfully!');
          document.getElementById('notif-title').value = '';
          document.getElementById('notif-message').value = '';
        } else {
          alert(`Error: ${json.message}`);
        }
      } catch (err) {
        console.error(err);
      }
    });
  }

  // --- Streams Broadcast ---
  initStreams() {
    document.getElementById('add-stream-btn')?.addEventListener('click', async () => {
      const matchId = document.getElementById('stream-match-id').value;
      const sourceName = document.getElementById('stream-source').value;
      const url = document.getElementById('stream-url').value;
      const language = document.getElementById('stream-lang').value;

      if (!matchId || !sourceName || !url) {
        alert('Please fill out Match ID, Source Name, and URL.');
        return;
      }

      try {
        const res = await fetch(`${API_URL}/streams`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ matchId, sourceName, url, language })
        });
        const json = await res.json();
        if (json.success) {
          alert('Stream link added successfully!');
          document.getElementById('stream-source').value = '';
          document.getElementById('stream-url').value = '';
        } else {
          alert(`Error: ${json.message}`);
        }
      } catch (err) {
        console.error(err);
      }
    });
  }

  initLogout() {
    document.getElementById('logout-btn').addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/index.html';
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.adminApp = new AdminDashboard();
});
