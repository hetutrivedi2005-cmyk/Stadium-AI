import { CONFIG } from '../config.js';

/**
 * Pub-Sub State Store for Global App State
 * Standardized data flow that decouples components from state mutations.
 */
class GlobalState {
  constructor() {
    this.listeners = {};
    
    // Load session if exists
    let savedUser = null;
    try {
      const session = sessionStorage.getItem(CONFIG.SESSION_STORAGE_KEY);
      if (session) savedUser = JSON.parse(session);
    } catch (e) {
      console.error("Failed parsing session", e);
    }

    // Default state parameters
    this.state = {
      user: savedUser, // Active user object (null if guest)
      activeVenueKey: 'estadio-azteca',
      selectedBlock: 'north',
      activeLayer: 'density',
      hoveredBlock: null,
      ccIncidents: 1,
      activePathRoute: 'fastest',
      
      // Telemetry metrics
      metrics: {
        attendance: 87435,
        throughput: 1238,
        throughputSla: 98.8,
        languagesAssists: 38
      },
      
      // Accessibility settings
      accessibility: {
        contrast: false,
        scaling: false,
        voice: false,
        guide: false
      },
      
      // Toast messaging
      toasts: [],
      
      // Active lists
      incidentsList: [
        { time: '19:22:45', msg: 'Gate A queue count exceeding turnstile limits. Reroute SOP firing.', isAlert: true },
        { time: '19:18:10', msg: 'Transport sync: Subway line 2 frequency increased by CDMX Transit.', isAlert: false },
        { time: '19:10:05', msg: 'Resource concourse lighting load shed complete. 12% power load reduction.', isAlert: false }
      ]
    };
  }

  // Subscribe to changes in a specific state key
  subscribe(key, fn) {
    if (!this.listeners[key]) {
      this.listeners[key] = [];
    }
    this.listeners[key].push(fn);
    
    // Return unsubscribe hook
    return () => {
      this.listeners[key] = this.listeners[key].filter(x => x !== fn);
    };
  }

  // Get current state
  getState() {
    return this.state;
  }

  // Get specific key
  get(key) {
    return this.state[key];
  }

  // Set state value and notify subscribers
  set(key, value) {
    const prevValue = this.state[key];
    this.state[key] = value;
    
    // Trigger callbacks if value changed
    if (JSON.stringify(prevValue) !== JSON.stringify(value)) {
      if (this.listeners[key]) {
        this.listeners[key].forEach(fn => fn(value, prevValue));
      }
    }
  }

  // Deep update nested properties (e.g. state.metrics.attendance)
  setNested(parentKey, childKey, value) {
    const parent = { ...this.state[parentKey] };
    const prevValue = parent[childKey];
    parent[childKey] = value;
    this.state[parentKey] = parent;

    if (prevValue !== value) {
      if (this.listeners[`${parentKey}.${childKey}`]) {
        this.listeners[`${parentKey}.${childKey}`].forEach(fn => fn(value, prevValue));
      }
      // Also notify parent key changes
      if (this.listeners[parentKey]) {
        this.listeners[parentKey].forEach(fn => fn(parent));
      }
    }
  }

  // Save session storage helper
  saveSession(user) {
    this.set('user', user);
    if (user) {
      sessionStorage.setItem(CONFIG.SESSION_STORAGE_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(CONFIG.SESSION_STORAGE_KEY);
    }
  }
}

export const globalState = new GlobalState();
