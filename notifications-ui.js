const API_URL = (typeof API_BASE !== 'undefined') ? API_BASE : (['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'http://localhost:5000/api' : '/api');

class NotificationManager {
  constructor() {
    this.bell = document.getElementById('notification-bell');
    this.badge = document.getElementById('notification-badge');
    this.dropdown = document.getElementById('notification-dropdown');
    this.list = document.getElementById('notification-list');
    this.toastContainer = document.getElementById('toast-container');
    
    this.unreadCount = 0;
    this.socket = null;

    if (this.bell) {
      this.init();
    }
  }

  async init() {
    const token = localStorage.getItem('token');
    if (!token) return; // Only for logged in users

    this.bell.style.display = 'block';

    // 1. Fetch History
    await this.fetchHistory();

    // 2. Setup UI Events
    this.bell.addEventListener('click', (e) => {
      e.stopPropagation();
      this.dropdown.style.display = this.dropdown.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', (e) => {
      if (!this.bell.contains(e.target) && !this.dropdown.contains(e.target)) {
        this.dropdown.style.display = 'none';
      }
    });

    document.getElementById('mark-all-read')?.addEventListener('click', () => this.markAllRead());

    // 3. Connect WebSocket
    this.connectSocket(token);
  }

  async fetchHistory() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      
      if (json.success) {
        this.renderList(json.data.notifications);
        this.updateBadge(json.data.unread_count);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }

  connectSocket(token) {
    // Assuming socket.io is loaded via CDN globally
    if (typeof io === 'undefined') return;

    // Use the backend URL
    const socketUrl = API_URL.replace('/api', '');
    this.socket = io(socketUrl);

    this.socket.on('connect', () => {
      this.socket.emit('authenticate', token);
    });

    this.socket.on('notification', (notif) => {
      this.showToast(notif);
      this.unreadCount++;
      this.updateBadge(this.unreadCount);
      // Prepend to list
      this.prependToList(notif);
    });
  }

  updateBadge(count) {
    this.unreadCount = count;
    if (this.badge) {
      if (count > 0) {
        this.badge.style.display = 'block';
        this.badge.textContent = count > 9 ? '9+' : count;
      } else {
        this.badge.style.display = 'none';
      }
    }
  }

  async markAllRead() {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/notifications/all/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      this.updateBadge(0);
      document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  }

  getIconForType(type) {
    switch(type) {
      case 'goal': return '⚽';
      case 'match_start': return '⏱️';
      case 'match_end': return '🏁';
      case 'news': return '📰';
      case 'transfer': return '🔄';
      default: return '🔔';
    }
  }

  getColorForType(type) {
    switch(type) {
      case 'goal': return '#22c55e'; // Green
      case 'news': return '#3b82f6'; // Blue
      case 'transfer': return '#f59e0b'; // Orange
      default: return 'var(--accent)';
    }
  }

  renderList(notifications) {
    if (!notifications || notifications.length === 0) return;

    this.list.innerHTML = notifications.map(n => this.createListItemHtml(n)).join('');
  }

  prependToList(notif) {
    const emptyMsg = this.list.querySelector('div[style*="text-align: center"]');
    if (emptyMsg) emptyMsg.remove();

    this.list.insertAdjacentHTML('afterbegin', this.createListItemHtml(notif));
  }

  createListItemHtml(n) {
    const isUnread = !n.is_read ? 'background: rgba(255,255,255,0.03); border-left: 3px solid var(--accent);' : 'border-left: 3px solid transparent;';
    const link = n.link ? `onclick="window.location.href='${n.link}'" style="cursor:pointer;"` : '';

    return `
      <div class="notif-item ${!n.is_read ? 'unread' : ''}" ${link} style="padding: 15px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; gap: 15px; align-items: flex-start; transition: background 0.2s; ${isUnread}">
        <div style="font-size: 1.5rem; background: rgba(255,255,255,0.05); width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%;">
          ${this.getIconForType(n.type)}
        </div>
        <div style="flex: 1;">
          <div style="font-weight: 600; font-size: 0.9rem; margin-bottom: 3px;">${n.title}</div>
          <div style="color: var(--muted); font-size: 0.85rem; line-height: 1.4;">${n.message}</div>
          <div style="color: var(--muted); font-size: 0.75rem; margin-top: 5px;">Just now</div>
        </div>
      </div>
    `;
  }

  showToast(notif) {
    if (!this.toastContainer) return;

    const toastId = 'toast-' + Date.now();
    const color = this.getColorForType(notif.type);

    const toastHtml = `
      <div id="${toastId}" style="background: var(--secondary); border: 1px solid rgba(255,255,255,0.1); border-left: 4px solid ${color}; border-radius: 8px; padding: 15px 20px; width: 300px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); transform: translateX(120%); transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); display: flex; gap: 15px; cursor: pointer;">
        <div style="font-size: 1.5rem;">${this.getIconForType(notif.type)}</div>
        <div style="flex: 1;">
          <div style="font-weight: 600; font-size: 0.9rem; margin-bottom: 2px;">${notif.title}</div>
          <div style="color: var(--muted); font-size: 0.85rem; line-height: 1.3;">${notif.message}</div>
        </div>
      </div>
    `;

    this.toastContainer.insertAdjacentHTML('beforeend', toastHtml);

    const el = document.getElementById(toastId);
    
    // Animate in
    setTimeout(() => {
      el.style.transform = 'translateX(0)';
    }, 100);

    // Click to dismiss and go to link
    el.addEventListener('click', () => {
      if (notif.link) window.location.href = notif.link;
      el.style.transform = 'translateX(120%)';
      setTimeout(() => el.remove(), 400);
    });

    // Auto dismiss after 5s
    setTimeout(() => {
      if (document.getElementById(toastId)) {
        el.style.transform = 'translateX(120%)';
        setTimeout(() => el.remove(), 400);
      }
    }, 5000);
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  window.notificationManager = new NotificationManager();
});
