import { CONFIG } from '../config.js';

/**
 * Reusable HTTP API Client with support for simulated latency,
 * automatic transient error retries, and global loading events.
 */
class ApiClient {
  constructor() {
    this.activeRequests = 0;
    this.listeners = new Set();
  }

  // Subscribe to global loading states (e.g. for spinners)
  onLoadingChange(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  _notifyLoading(isLoading) {
    this.listeners.forEach(fn => fn(isLoading, this.activeRequests));
  }

  /**
   * Helper to wait/simulate latency in mockup mode
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Request wrapper with automatic retry capabilities
   */
  async request(endpoint, options = {}, attempt = 1) {
    this.activeRequests++;
    this._notifyLoading(true);

    try {
      if (CONFIG.MOCK_MODE) {
        // Wait simulated latency
        await this._delay(CONFIG.LATENCY_MS);
        
        // Occasional transient error simulation to test retry (1% probability)
        if (Math.random() < 0.01) {
          throw new Error('Transient Network Error (Simulated)');
        }
      }

      const url = CONFIG.API_BASE_URL + endpoint;
      
      // If we are in mock mode, we intercept and throw a bypass flag or return dummy.
      // In real mode, we run standard fetch.
      if (!CONFIG.MOCK_MODE) {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      }

      // If mock, actual fetch is bypassed. Calling services will capture this request 
      // and provide localized mock data structures instead.
      return { success: true };

    } catch (error) {
      console.warn(`API Request attempt ${attempt} failed: ${error.message}`);
      
      if (attempt < CONFIG.RETRY_LIMIT) {
        // Exponential backoff
        await this._delay(Math.pow(2, attempt) * 150);
        this.activeRequests--;
        return this.request(endpoint, options, attempt + 1);
      }
      
      // Fire error toast event
      window.dispatchEvent(new CustomEvent('stadiumai-toast', {
        detail: { type: 'error', message: `Connection failed: ${error.message}` }
      }));
      throw error;

    } finally {
      this.activeRequests = Math.max(0, this.activeRequests - 1);
      this._notifyLoading(this.activeRequests > 0);
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body = {}, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  put(endpoint, body = {}, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }
}

export const apiClient = new ApiClient();
