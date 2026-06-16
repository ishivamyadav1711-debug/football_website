/**
 * PitchLive Auth Manager
 * Handles all client-side authentication state, token management,
 * API calls, and protected route enforcement
 */

// Backend API base URL — always points to our Express server on port 5000
const API_BASE = window.PitchLive_API || 'http://localhost:5000/api';

// ============================================================
// Token Storage & Management
// ============================================================
const TokenStorage = {
  getAccessToken: () => sessionStorage.getItem('sx_access_token'),

  setAccessToken: (token) => {
    sessionStorage.setItem('sx_access_token', token);
    // Decode and store expiry for silent refresh scheduling
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      sessionStorage.setItem('sx_token_expiry', payload.exp * 1000);
    } catch {}
  },

  clearAccessToken: () => {
    sessionStorage.removeItem('sx_access_token');
    sessionStorage.removeItem('sx_token_expiry');
  },

  getExpiry: () => parseInt(sessionStorage.getItem('sx_token_expiry') || '0'),

  isExpiringSoon: () => {
    const expiry = TokenStorage.getExpiry();
    if (!expiry) return true;
    // Refresh if less than 60 seconds remaining
    return Date.now() > expiry - 60 * 1000;
  },
};

// ============================================================
// AuthManager — Main auth logic
// ============================================================
const AuthManager = {
  _user: null,
  _refreshPromise: null,

  /**
   * Make an authenticated API call
   * Automatically refreshes the access token if expired
   */
  apiCall: async (url, options = {}) => {
    let token = TokenStorage.getAccessToken();

    // Proactively refresh if token is expiring soon
    if (token && TokenStorage.isExpiringSoon()) {
      token = await AuthManager.silentRefresh();
    }

    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      credentials: 'include', // Required for HttpOnly refresh token cookie
    });

    // If we get a 401 with TOKEN_EXPIRED, try a silent refresh and retry once
    if (response.status === 401) {
      const data = await response.clone().json().catch(() => ({}));
      if (data.code === 'TOKEN_EXPIRED') {
        const newToken = await AuthManager.silentRefresh();
        if (newToken) {
          return fetch(`${API_BASE}${url}`, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${newToken}`,
              ...options.headers,
            },
            credentials: 'include',
          });
        }
      }
    }

    return response;
  },

  /**
   * Silently exchange the HttpOnly refresh cookie for a new access token
   * Prevents duplicate refresh calls with promise deduplication
   */
  silentRefresh: async () => {
    if (AuthManager._refreshPromise) return AuthManager._refreshPromise;

    AuthManager._refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (!res.ok) {
          AuthManager.clearAuth();
          return null;
        }

        const data = await res.json();
        if (data.data?.accessToken) {
          TokenStorage.setAccessToken(data.data.accessToken);
          return data.data.accessToken;
        }
        return null;
      } catch {
        return null;
      } finally {
        AuthManager._refreshPromise = null;
      }
    })();

    return AuthManager._refreshPromise;
  },

  /**
   * Load current user from API (uses cached value if available)
   */
  getUser: async () => {
    if (AuthManager._user) return AuthManager._user;

    const token = TokenStorage.getAccessToken();
    if (!token) return null;

    try {
      const res = await AuthManager.apiCall('/auth/me');
      if (!res.ok) return null;
      const data = await res.json();
      AuthManager._user = data.data?.user || null;
      return AuthManager._user;
    } catch {
      return null;
    }
  },

  /**
   * Check if the user is currently authenticated
   */
  isAuthenticated: () => {
    return !!TokenStorage.getAccessToken();
  },

  /**
   * Store tokens and user data after login/register
   */
  setAuth: (accessToken, user) => {
    TokenStorage.setAccessToken(accessToken);
    AuthManager._user = user;
    localStorage.setItem('sx_user', JSON.stringify(user));
  },

  /**
   * Clear all auth state (logout)
   */
  clearAuth: () => {
    TokenStorage.clearAccessToken();
    AuthManager._user = null;
    localStorage.removeItem('sx_user');
  },

  /**
   * Get cached user data (from localStorage, without API call)
   */
  getCachedUser: () => {
    if (AuthManager._user) return AuthManager._user;
    try {
      const stored = localStorage.getItem('sx_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  /**
   * Login with email and password
   */
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.success) {
      AuthManager.setAuth(data.data.accessToken, data.data.user);
    }
    return { ok: res.ok, data };
  },

  /**
   * Register a new account
   */
  register: async (payload) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      AuthManager.setAuth(data.data.accessToken, data.data.user);
    }
    return { ok: res.ok, data };
  },

  /**
   * Logout from current device
   */
  logout: async () => {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
    AuthManager.clearAuth();
    window.location.href = '/auth/login.html';
  },

  /**
   * Request a password reset email
   */
  forgotPassword: async (email) => {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return { ok: res.ok, data: await res.json() };
  },

  /**
   * Submit a new password with the reset token
   */
  resetPassword: async (token, password) => {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    return { ok: res.ok, data: await res.json() };
  },

  /**
   * Redirect to a protected page, or to login if not authenticated
   * Call this at the top of any protected page
   */
  requireAuth: async (redirectTo = '/auth/login.html') => {
    // Check for Google OAuth token in URL (after redirect)
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      TokenStorage.setAccessToken(urlToken);
      window.history.replaceState({}, '', window.location.pathname);
    }

    const token = TokenStorage.getAccessToken();
    if (!token) {
      // Try silent refresh (maybe user has valid cookie from before)
      const refreshed = await AuthManager.silentRefresh();
      if (!refreshed) {
        window.location.href = redirectTo;
        return null;
      }
    }

    return await AuthManager.getUser();
  },

  /**
   * Redirect away from auth pages if already logged in
   * Call this on login/register pages to prevent double login
   */
  redirectIfAuthenticated: async (to = '/index.html') => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      TokenStorage.setAccessToken(urlToken);
      window.location.href = to;
      return;
    }

    if (TokenStorage.getAccessToken()) {
      window.location.href = to;
    }
  },
};

// ============================================================
// Navbar Auth State Integration
// ============================================================
const updateNavbarAuth = () => {
  const user = AuthManager.getCachedUser();

  const loginBtn = document.getElementById('nav-login-btn');
  const userMenu = document.getElementById('nav-user-menu');
  const userAvatar = document.getElementById('nav-user-avatar');
  const userName = document.getElementById('nav-user-name');

  if (!loginBtn || !userMenu) return;

  if (user) {
    loginBtn.style.display = 'none';
    userMenu.style.display = 'flex';
    if (userAvatar) {
      if (user.avatar_url) {
        userAvatar.src = user.avatar_url;
        userAvatar.style.display = 'block';
      }
    }
    if (userName) {
      userName.textContent = user.display_name || user.username;
    }
  } else {
    loginBtn.style.display = 'flex';
    userMenu.style.display = 'none';
  }
};

// ============================================================
// Shared UI Helpers
// ============================================================

/**
 * Show an inline field error message
 */
const showFieldError = (inputId, message) => {
  const input = document.getElementById(inputId);
  const errorEl = document.getElementById(`${inputId}-error`);
  if (input) input.classList.add('is-error');
  if (errorEl) errorEl.textContent = message;
};

/**
 * Clear all field errors in a form
 */
const clearFormErrors = (formId) => {
  const form = document.getElementById(formId);
  if (!form) return;
  form.querySelectorAll('.form-input').forEach((el) => el.classList.remove('is-error'));
  form.querySelectorAll('.form-error').forEach((el) => (el.textContent = ''));
};

/**
 * Show alert message (error/success/info)
 */
const showAlert = (containerId, message, type = 'error') => {
  const container = document.getElementById(containerId);
  if (!container) return;

  const icons = { error: '⚠️', success: '✅', info: 'ℹ️' };
  container.innerHTML = `
    <div class="alert alert-${type}">
      <span>${icons[type]}</span>
      <span>${message}</span>
    </div>
  `;
};

/**
 * Toggle password visibility
 */
const initPasswordToggles = () => {
  document.querySelectorAll('[data-toggle-password]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.togglePassword;
      const input = document.getElementById(targetId);
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
      btn.querySelector('.eye-icon').textContent = input.type === 'password' ? '👁️' : '🙈';
    });
  });
};

/**
 * Password strength checker
 */
const checkPasswordStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 12) score++;

  const levels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const classes = ['', 'weak', 'fair', 'good', 'strong'];
  return { score: Math.min(score, 4), label: levels[Math.min(score, 4)], cls: classes[Math.min(score, 4)] };
};

const initStrengthMeter = (inputId, meterId, labelId) => {
  const input = document.getElementById(inputId);
  if (!input) return;

  input.addEventListener('input', () => {
    const { score, label, cls } = checkPasswordStrength(input.value);
    const bars = document.querySelectorAll(`#${meterId} .strength-bar`);
    bars.forEach((bar, i) => {
      bar.className = 'strength-bar';
      if (i < score) bar.classList.add(`active-${cls}`);
    });
    const labelEl = document.getElementById(labelId);
    if (labelEl) labelEl.textContent = input.value ? label : '';
  });
};

// Export for use in individual page scripts
window.AuthManager = AuthManager;
window.TokenStorage = TokenStorage;
window.updateNavbarAuth = updateNavbarAuth;
window.showFieldError = showFieldError;
window.clearFormErrors = clearFormErrors;
window.showAlert = showAlert;
window.initPasswordToggles = initPasswordToggles;
window.initStrengthMeter = initStrengthMeter;

