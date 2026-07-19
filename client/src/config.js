/**
 * StadiumAI Environment Configuration
 * Decouples API endpoints, credentials, and settings for production backend services.
 */

// Dynamically determine the backend API URL without hardcoding localhost.
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.VITE_API_URL) {
    return window.VITE_API_URL;
  }
  try {
    if (import.meta.env && import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
  } catch (e) {}
  
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000/api';
    }
    return window.location.origin + '/api'; // fallback to self-hosted API route
  }
  return 'http://localhost:3000/api';
};

export const CONFIG = {
  API_BASE_URL: getApiBaseUrl(), // REST URL for Express / Node.js
  WS_BASE_URL: (typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + (typeof window !== 'undefined' ? window.location.host : 'localhost') + '/ws', // Real-time telemetry WebSockets
  AI_PROVIDER: 'gemini', // 'gemini' | 'openai' | 'mock'
  AI_MODEL: 'gemini-3.5-flash', // Default target LLM
  LATENCY_MS: 400, // Simulated network latency for loading spinner states
  MOCK_MODE: true, // Set to false when connecting to Node.js/Firebase real backends
  RETRY_LIMIT: 3, // Retry attempts for transient REST API issues
  SESSION_STORAGE_KEY: 'stadiumai_session',
  THEME_STORAGE_KEY: 'stadiumai_theme',
  FIREBASE_ENABLED: true, // Specific flag for Firebase Authentication activation
  MAPS_API_KEY: 'BZ0ZhqFHRGcoc14ulfPr',
  WEATHER_API_KEY: '1b47262822e37f2cb935dbbed751bd9e',
  FOOTBALL_API_KEY: '333c366ea83247649c3be527e59671ba',
  NEWS_API_KEY: '069530b5313159af56485bfdede116e3',
  FIREBASE_CONFIG: {
    apiKey: "AIzaSyCiWqiwQ65H7wFO3kL7owOHttvoaWOF-5c",
    authDomain: "stadiumai.firebaseapp.com",
    projectId: "stadiumai",
    storageBucket: "stadiumai.firebasestorage.app",
    messagingSenderId: "440102038143",
    appId: "1:440102038143:web:880e988e12eda87b64ad4a",
    measurementId: "G-5968XYJDX1"
  }
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    PROFILE: '/auth/profile',
    UPDATE_PROFILE: '/auth/profile/update'
  },
  STADIUM: {
    TELEMETRY: '/stadium/telemetry',
    SECTORS: '/stadium/sectors',
    MITIGATION: '/stadium/mitigation',
    INCIDENTS: '/stadium/incidents',
    TASKS: '/stadium/tasks',
    TRANSIT: '/stadium/transit'
  },
  AI: {
    ASSISTANT: '/ai/assistant',
    ANALYZE_INCIDENT: '/ai/incident/analyze',
    TRANSLATE: '/ai/translate'
  }
};
