import { AuthContext } from '../context/AuthContext.js';

class ProtectedRouteClass {
  constructor() {
    this.modal = document.getElementById('access-modal');
    this.closeBtn = document.getElementById('close-modal-btn');
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Subscribe to authentication changes
    AuthContext.subscribe(({ currentUser, loading }) => {
      if (loading) {
        // App is loading auth state (checking token)
        this._showGlobalLoader(true);
        return;
      }

      this._showGlobalLoader(false);

      if (!currentUser) {
        // Unauthenticated -> Force redirect to login modal
        this._enforceAuthModal();
      } else {
        // Authenticated -> Unlock page and redirect by role
        this._unlockApp(currentUser);
      }
    });
  }

  _showGlobalLoader(show) {
    let loader = document.getElementById('auth-route-loader');
    if (!loader && show) {
      loader = document.createElement('div');
      loader.id = 'auth-route-loader';
      loader.innerHTML = `
        <div class="loader-content" style="text-align: center; color: white;">
          <span class="ai-pulse-ring" style="width: 48px; height: 48px; margin-bottom: 12px; display: inline-block;"></span>
          <p style="font-family: var(--font-sans); font-size: 0.9rem; letter-spacing: 0.05em; margin: 0;">SYNCHRONIZING SECURE SESSION...</p>
        </div>
      `;
      loader.style.position = 'fixed';
      loader.style.top = '0';
      loader.style.left = '0';
      loader.style.width = '100vw';
      loader.style.height = '100vh';
      loader.style.background = 'var(--bg-main)';
      loader.style.display = 'flex';
      loader.style.alignItems = 'center';
      loader.style.justifyContent = 'center';
      loader.style.zIndex = '99999';
      document.body.appendChild(loader);
    } else if (loader && !show) {
      loader.remove();
    }
  }

  _enforceAuthModal() {
    if (!this.modal) return;

    // 1. Open the modal
    this.modal.classList.add('active');

    // 2. Override displays to show Login View first
    const loginView = document.getElementById('auth-view-login');
    const profileView = document.getElementById('auth-view-profile');
    if (loginView) loginView.style.display = 'flex';
    if (profileView) profileView.style.display = 'none';

    // 3. Hide closing buttons to prevent bypassing auth
    if (this.closeBtn) this.closeBtn.style.display = 'none';
  }

  _unlockApp(user) {
    if (!this.modal) return;

    // 1. Restore close button
    if (this.closeBtn) this.closeBtn.style.display = 'flex';

    // 2. Hide modal
    this.modal.classList.remove('active');

    // 3. Handle Role-Based Dashboard View redirects
    this._applyRoleRestrictions(user.role);
  }

  _applyRoleRestrictions(role) {
    const tabButtons = document.querySelectorAll('.console-tab-btn');
    let targetTab = 'stadium-nav'; // Default fallback

    const normalizedRole = (role || '').toLowerCase();

    if (normalizedRole === 'fan') {
      targetTab = 'stadium-nav';
      this._toggleTabButtonVisibility('crowd-intel', false);
      this._toggleTabButtonVisibility('volunteer-copilot', false);
    } else if (normalizedRole === 'volunteer') {
      targetTab = 'volunteer-copilot';
      this._toggleTabButtonVisibility('crowd-intel', false);
      this._toggleTabButtonVisibility('volunteer-copilot', true);
    } else if (normalizedRole === 'security') {
      targetTab = 'crowd-intel';
      this._toggleTabButtonVisibility('crowd-intel', true);
      this._toggleTabButtonVisibility('volunteer-copilot', false);
    } else if (normalizedRole === 'medical' || normalizedRole === 'medical-staff') {
      targetTab = 'crowd-intel';
      this._toggleTabButtonVisibility('crowd-intel', true);
      this._toggleTabButtonVisibility('volunteer-copilot', false);
    } else if (normalizedRole === 'organizer' || normalizedRole === 'admin') {
      targetTab = 'crowd-intel';
      this._toggleTabButtonVisibility('crowd-intel', true);
      this._toggleTabButtonVisibility('volunteer-copilot', true);
    }

    // Trigger tab redirection programmatically
    const btn = document.querySelector(`.console-tab-btn[data-tab="${targetTab}"]`);
    if (btn) {
      btn.click();
    }
  }

  _toggleTabButtonVisibility(tabId, isVisible) {
    const btn = document.querySelector(`.console-tab-btn[data-tab="${tabId}"]`);
    if (btn) {
      btn.style.display = isVisible ? 'inline-flex' : 'none';
    }
  }
}

export const ProtectedRoute = new ProtectedRouteClass();
