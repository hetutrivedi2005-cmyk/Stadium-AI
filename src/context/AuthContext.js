import { authService } from '../services/authService.js';
import { auth } from '../firebase/firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { globalState } from '../state/global-state.js';

class AuthContextClass {
  constructor() {
    this.currentUser = null;
    this.loading = true;
    this.listeners = [];

    // Bootstrap listener to Firebase Auth changes
    onAuthStateChanged(auth, async (user) => {
      this.loading = true;
      this._notifyListeners();

      if (user) {
        try {
          // Fetch full profile (contains role metadata) from Firestore
          const profile = await authService.getUserProfile(user.uid);
          this.currentUser = profile || {
            uid: user.uid,
            fullName: user.displayName || "Spectator",
            email: user.email,
            role: "fan",
            photoURL: user.photoURL
          };
        } catch (err) {
          console.error("Failed to load user profile from Firestore:", err);
          this.currentUser = {
            uid: user.uid,
            fullName: user.displayName || "Spectator",
            email: user.email,
            role: "fan",
            photoURL: user.photoURL
          };
        }
      } else {
        this.currentUser = null;
      }

      this.loading = false;
      globalState.saveSession(this.currentUser); // Sync global session state
      this._notifyListeners();
    });
  }

  // Subscribe to changes in Auth state (like React Context updates)
  subscribe(callback) {
    this.listeners.push(callback);
    // Execute callback immediately with current values
    callback({ currentUser: this.currentUser, loading: this.loading });
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  _notifyListeners() {
    this.listeners.forEach(cb => cb({ currentUser: this.currentUser, loading: this.loading }));
  }

  async login(email, password) {
    const profile = await authService.login(email, password);
    this.currentUser = profile;
    this._notifyListeners();
    return profile;
  }

  async register(fullName, email, password, role) {
    const profile = await authService.register(fullName, email, password, role);
    this.currentUser = profile;
    this._notifyListeners();
    return profile;
  }

  async logout() {
    await authService.logout();
    this.currentUser = null;
    this._notifyListeners();
  }

  async resetPassword(email) {
    return await authService.resetPassword(email);
  }
}

export const AuthContext = new AuthContextClass();
