import { AuthContext } from '../context/AuthContext.js';
import { LoginController } from '../authentication/Login.js';
import { RegisterController } from '../authentication/Register.js';
import { ForgotPasswordController } from '../authentication/ForgotPassword.js';
import { globalState } from '../state/global-state.js';
import { toast } from './toast.js';

/**
 * Controller for the Role-Based Authentication Modals Flow
 * Manages Login, Sign-up, Password Reset, and profile states.
 */
class AuthUi {
  constructor() {
    this.modal = document.getElementById('access-modal');
    this.openBtns = document.querySelectorAll('.open-modal-btn');
    this.closeBtn = document.getElementById('close-modal-btn');
    
    this.views = {
      login: document.getElementById('auth-view-login'),
      register: document.getElementById('auth-view-register'),
      forgot: document.getElementById('auth-view-forgot'),
      profile: document.getElementById('auth-view-profile'),
      success: document.getElementById('form-success-screen')
    };

    this.forms = {
      login: document.getElementById('auth-form-login'),
      register: document.getElementById('auth-form-register'),
      forgot: document.getElementById('auth-form-forgot'),
      profile: document.getElementById('auth-form-profile')
    };

    this.init();
  }

  init() {
    // 1. Open/Close Modal Listeners
    this.openBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.open();
      });
    });

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        // Block closing if the user is not authenticated (enforces protected route)
        if (e.target === this.modal && AuthContext.currentUser) {
          this.close();
        }
      });
    }

    // 2. Form Submissions
    if (this.forms.login) {
      this.forms.login.addEventListener('submit', (e) => this.handleLogin(e));
    }
    if (this.forms.register) {
      this.forms.register.addEventListener('submit', (e) => this.handleRegister(e));
    }
    if (this.forms.forgot) {
      this.forms.forgot.addEventListener('submit', (e) => this.handleForgot(e));
    }
    if (this.forms.profile) {
      this.forms.profile.addEventListener('submit', (e) => this.handleUpdateProfile(e));
    }

    // 3. Bind navigation links within forms
    this._bindNavigationLinks();

    // 4. Listen to user state changes to sync profile status bar
    globalState.subscribe('user', (user) => this.syncUserUIState(user));
    
    // Sync initial state
    this.syncUserUIState(globalState.get('user'));
  }

  open() {
    if (!this.modal) return;
    this.modal.classList.add('active');
    
    const user = globalState.get('user');
    if (user) {
      this.showView('profile');
      this._prefillProfileForm(user);
    } else {
      this.showView('login');
    }
  }

  close() {
    // Only allow closing if logged in
    if (AuthContext.currentUser) {
      if (this.modal) this.modal.classList.remove('active');
    } else {
      toast.show("Please log in or register to access the dashboard.", "info");
    }
  }

  showView(viewName) {
    Object.keys(this.views).forEach(key => {
      if (this.views[key]) {
        this.views[key].style.display = key === viewName ? 'flex' : 'none';
        if (key === viewName && this.views[key].classList.contains('modal-success')) {
          this.views[key].style.display = 'flex';
        }
      }
    });
  }

  _bindNavigationLinks() {
    // Links to register
    document.querySelectorAll('.go-to-register').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.showView('register');
      });
    });

    // Links to login
    document.querySelectorAll('.go-to-login').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.showView('login');
      });
    });

    // Links to forgot password
    document.querySelectorAll('.go-to-forgot').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.showView('forgot');
      });
    });
  }

  _setLoading(form, isLoading) {
    const btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
    
    if (isLoading) {
      btn.disabled = true;
      btn.dataset.originalText = btn.textContent;
      btn.innerHTML = `<span class="ai-pulse-ring" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 8px;"></span> Loading...`;
    } else {
      btn.disabled = false;
      btn.textContent = btn.dataset.originalText || 'Submit';
    }
  }

  // Handle Login Submission
  async handleLogin(e) {
    e.preventDefault();
    const form = this.forms.login;
    const email = form.querySelector('#login-email').value;
    const password = form.querySelector('#login-password').value;

    this._setLoading(form, true);
    try {
      const user = await LoginController.submit(email, password);
      toast.show(`Welcome back, ${user.fullName}! Logged in as ${user.role}.`, 'success');
      this.close();
    } catch (err) {
      toast.show(err.message, 'error');
    } finally {
      this._setLoading(form, false);
    }
  }

  // Handle Register Submission
  async handleRegister(e) {
    e.preventDefault();
    const form = this.forms.register;
    const name = form.querySelector('#reg-name').value;
    const email = form.querySelector('#reg-email').value;
    const password = form.querySelector('#reg-password').value;
    const role = form.querySelector('#reg-role').value;

    this._setLoading(form, true);
    try {
      const user = await RegisterController.submit(name, email, password, role);
      toast.show(`Account created! Logged in as ${user.role}.`, 'success');
      this.close();
    } catch (err) {
      toast.show(err.message, 'error');
    } finally {
      this._setLoading(form, false);
    }
  }

  // Handle Forgot Password
  async handleForgot(e) {
    e.preventDefault();
    const form = this.forms.forgot;
    const email = form.querySelector('#forgot-email').value;

    this._setLoading(form, true);
    try {
      await ForgotPasswordController.submit(email);
      this.showView('success');
      toast.show("Password reset email sent successfully.", 'success');
    } catch (err) {
      toast.show(err.message, 'error');
    } finally {
      this._setLoading(form, false);
    }
  }

  // Prefill active user data in Profile panel inputs
  _prefillProfileForm(user) {
    const form = this.forms.profile;
    form.querySelector('#prof-name').value = user.fullName || user.name;
    form.querySelector('#prof-email').value = user.email;
    form.querySelector('#prof-role').value = user.role;
    form.querySelector('#prof-venue').value = user.venue || 'Estadio Azteca';
  }

  // Handle Profile Update
  async handleUpdateProfile(e) {
    e.preventDefault();
    const form = this.forms.profile;
    const name = form.querySelector('#prof-name').value;
    const venue = form.querySelector('#prof-venue').value;

    this._setLoading(form, true);
    try {
      await AuthContext.updateProfile({ fullName: name, venue });
      toast.show("Profile details updated successfully.", 'success');
      this.close();
    } catch (err) {
      toast.show(err.message, 'error');
    } finally {
      this._setLoading(form, false);
    }
  }

  // Handle Logout
  async performLogout() {
    try {
      await AuthContext.logout();
      toast.show("Logged out successfully.", 'info');
      // Redirect page to force login overlay
      window.location.reload();
    } catch (err) {
      toast.show(err.message, 'error');
    }
  }

  /**
   * Sync active user sessions across Header nav and Dashboard profile widgets
   */
  syncUserUIState(user) {
    const headerBtn = document.querySelector('.header-actions button.btn-primary') || document.querySelector('.header-actions button.btn-secondary');
    if (!headerBtn) return;

    const avatarEl = document.querySelector('.header-actions .avatar');

    if (user) {
      const displayName = user.fullName || user.name || "Spectator";
      headerBtn.innerHTML = `
        <span style="display: flex; align-items: center; gap: 8px;">
          <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <span>${displayName} (${user.role})</span>
        </span>
      `;
      headerBtn.classList.remove('btn-primary');
      headerBtn.classList.add('btn-secondary');
      
      const roleBadge = document.getElementById('user-role-badge-ticker');
      if (roleBadge) {
        roleBadge.textContent = user.role.toUpperCase();
        roleBadge.className = `sim-cc-badge nominal`;
        roleBadge.style.display = 'inline-block';
      }

      if (avatarEl) {
        const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        avatarEl.textContent = initials || "U";
        avatarEl.title = displayName;
      }
    } else {
      headerBtn.textContent = 'Request access →';
      headerBtn.classList.remove('btn-secondary');
      headerBtn.classList.add('btn-primary');
      
      const roleBadge = document.getElementById('user-role-badge-ticker');
      if (roleBadge) {
        roleBadge.style.display = 'none';
      }

      if (avatarEl) {
        avatarEl.textContent = "??";
        avatarEl.title = "Not Logged In";
      }
    }
  }
}

// Global hook for logout action from HTML template
window.performAuthLogout = () => {
  const authUi = window.stadiumAiAuthUi;
  if (authUi) authUi.performLogout();
};

export { AuthUi };
