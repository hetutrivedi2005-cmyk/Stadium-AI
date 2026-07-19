import { CONFIG } from '../config.js';
import { globalState } from '../state/global-state.js';
import { aiService } from './ai-service.js';
import { toast } from '../ui/toast.js';

class ApiIntegration {
  constructor() {
    this.mapInstance = null;
    this.userMarker = null;
    this.stadiumMarker = null;
    this.markersGroup = null;
    this.routePath = null;
    
    this.userCoords = null; // [lat, lon]
    this.stadiumsDb = [];
    
    this.speechSynthesis = window.speechSynthesis;
    this.speechUtterance = null;
    this.recognition = null;
    this.isListening = false;
  }

  async init() {
    // 1. Fetch stadiums database
    try {
      const res = await fetch('/data/stadiums.json');
      this.stadiumsDb = await res.json();
      console.log("Stadiums database loaded:", this.stadiumsDb.length, "venues found.");
    } catch (e) {
      console.warn("Failed to load stadiums JSON database:", e.message);
    }

    // 2. Load Leaflet CDN Assets dynamically
    this._loadLeafletAssets();

    // 3. Setup Browser Geolocation
    this.setupGeolocation();

    // 4. Initialize Speech APIs
    this.setupSpeechSynthesis();
    this.setupSpeechRecognition();

    // 5. Initialize Live Data Pollers (Weather, Football, News)
    this.startLiveDataPollers();

    // 6. Monitor venue changes to update map & weather
    globalState.subscribe('activeVenueKey', () => {
      this.updateActiveVenueTelemetry();
    });

    // Run initial update
    this.updateActiveVenueTelemetry();
    
    // Setup dynamic lightbox
    this.setupLightboxGallery();
  }

  _loadLeafletAssets() {
    if (document.getElementById('leaflet-css')) return;

    const css = document.createElement('link');
    css.id = 'leaflet-css';
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);

    const js = document.createElement('script');
    js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    js.onload = () => {
      console.log("Leaflet library loaded. Creating interactive map bindings...");
      this.setupInteractiveMapToggle();
    };
    document.head.appendChild(js);

    // CSS Keyframe animation for active routes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes routeDash {
        to { stroke-dashoffset: -20; }
      }
      .leaflet-route-animated {
        animation: routeDash 1.2s linear infinite;
      }
      .leaflet-map-toggle-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 10;
        background: var(--bg-card, rgba(255,255,255,0.85));
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        padding: 4px 10px;
        font-size: 0.65rem;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: all 0.2s;
        box-shadow: var(--shadow-sm);
      }
      .leaflet-map-toggle-btn:hover {
        background: var(--bg-primary);
        transform: translateY(-1px);
      }
      .map-control-panel {
        padding: 8px 12px;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        margin-top: 8px;
        font-size: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .map-search-row {
        display: flex;
        gap: 6px;
      }
      .map-search-input {
        flex: 1;
        padding: 4px 8px;
        font-size: 0.7rem;
        border-radius: var(--radius-sm);
        border: 1px solid var(--border-color);
        background: var(--bg-secondary);
        color: var(--text-primary);
        outline: none;
      }
      .map-search-btn {
        background: var(--accent-green-light);
        border: 1px solid var(--accent-green);
        color: var(--accent-green);
        border-radius: var(--radius-sm);
        font-size: 0.7rem;
        padding: 4px 10px;
        font-weight: 600;
        cursor: pointer;
      }
      .stt-listening-active {
        background: rgba(239, 68, 68, 0.15) !important;
        border-color: var(--accent-red) !important;
        color: var(--accent-red) !important;
        animation: pulseRed 1.5s infinite;
      }
      @keyframes pulseRed {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
  }

  // ----------------------------------------------------
  // GEOLOCATION ENGINE
  // ----------------------------------------------------
  setupGeolocation() {
    if (!navigator.geolocation) {
      console.warn("Browser Geolocation API is not supported on this browser.");
      toast.show("Geolocation unsupported. Using manual location selection.", "warn");
      this.fallbackSimulatedUserLocation();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.userCoords = [pos.coords.latitude, pos.coords.longitude];
        console.log("User geolocation successfully acquired:", this.userCoords);
        globalState.set('userCoords', this.userCoords);
        this.updateDistanceTelemetry();
        toast.show("Spectator coordinates synchronized successfully.", "info");
      },
      (err) => {
        let errorMsg = "Geolocation access failed.";
        if (err.code === err.PERMISSION_DENIED) {
          errorMsg = "Geolocation permission denied by user. Using manual coordinates.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errorMsg = "Spectator coordinate position unavailable. Using manual coordinates.";
        } else if (err.code === err.TIMEOUT) {
          errorMsg = "Geolocation request timed out. Using manual coordinates.";
        }
        console.warn("Geolocation error state:", err.message);
        toast.show(errorMsg, "warn");
        this.fallbackSimulatedUserLocation();
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  fallbackSimulatedUserLocation() {
    const venue = this.getActiveVenueDetails();
    if (venue) {
      // Simulate user standing 1.2km north-east of the stadium lobby
      this.userCoords = [venue.latitude + 0.008, venue.longitude + 0.008];
      globalState.set('userCoords', this.userCoords);
      this.updateDistanceTelemetry();
    }
  }

  calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  updateDistanceTelemetry() {
    if (!this.userCoords) return;
    const venue = this.getActiveVenueDetails();
    if (!venue) return;

    const distance = this.calculateHaversineDistance(
      this.userCoords[0], this.userCoords[1],
      venue.latitude, venue.longitude
    );

    // Save user location details for Gemini Prompt Context
    const userLocation = {
      latitude: this.userCoords[0],
      longitude: this.userCoords[1],
      distanceKm: parseFloat(distance.toFixed(2)),
      nearestGate: venue.gates?.[0] || "Gate A",
      nearestParking: venue.parking?.[0] || "Zone A",
      walkingMinutes: Math.round(distance / 5 * 60)
    };
    
    globalState.set('userLocationContext', userLocation);

    // Update frontend UI elements dynamically if they exist on the page
    const distEl = document.getElementById('user-stadium-distance');
    const timeEl = document.getElementById('user-stadium-time');
    const gateEl = document.getElementById('user-nearest-gate');
    const parkEl = document.getElementById('user-nearest-parking');

    if (distEl) distEl.textContent = `${distance.toFixed(2)} km`;
    if (timeEl) timeEl.textContent = `${Math.round(distance / 5 * 60)} min walking`;
    if (gateEl) gateEl.textContent = userLocation.nearestGate;
    if (parkEl) parkEl.textContent = userLocation.nearestParking;

    // Refresh route lines on maps
    if (this.mapInstance && this.userMarker) {
      this.userMarker.setLatLng(this.userCoords);
      this.drawAnimatedRoute();
    }
  }

  // ----------------------------------------------------
  // INTERACTIVE STADIUM MAP
  // ----------------------------------------------------
  setupInteractiveMapToggle() {
    const containers = [
      { canvasId: 'stadium-nav-canvas', toggleId: 'nav-map-toggle' },
      { canvasId: 'copilot-map-canvas', toggleId: 'copilot-map-toggle' }
    ];

    containers.forEach(item => {
      const canvas = document.getElementById(item.canvasId);
      if (!canvas) return;

      const parent = canvas.parentNode;
      if (!parent) return;

      parent.style.position = 'relative';

      // 1. Create mapping div container
      const mapDiv = document.createElement('div');
      mapDiv.id = `${item.canvasId}-leaflet-container`;
      mapDiv.style.width = '100%';
      mapDiv.style.height = canvas.style.height || '380px';
      mapDiv.style.display = 'none';
      mapDiv.style.borderRadius = 'var(--radius-sm)';
      mapDiv.style.background = '#1e293b';
      parent.appendChild(mapDiv);

      // 2. Add Control Panel search elements
      const ctrlPanel = document.createElement('div');
      ctrlPanel.className = 'map-control-panel';
      ctrlPanel.style.display = 'none';
      ctrlPanel.innerHTML = `
        <div class="map-search-row">
          <input type="text" class="map-search-input" placeholder="Search parking, washrooms, metro...">
          <button class="map-search-btn">Find Nearest</button>
        </div>
      `;
      parent.appendChild(ctrlPanel);

      // 3. Create Toggle Button
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'leaflet-map-toggle-btn';
      toggleBtn.innerHTML = `
        <svg style="width: 12px; height: 12px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
        <span>Toggle Interactive Map</span>
      `;

      toggleBtn.addEventListener('click', () => {
        const isCanvas = canvas.style.display !== 'none';
        if (isCanvas) {
          canvas.style.display = 'none';
          mapDiv.style.display = 'block';
          ctrlPanel.style.display = 'flex';
          this.mountLeafletMap(mapDiv.id);
        } else {
          canvas.style.display = 'block';
          mapDiv.style.display = 'none';
          ctrlPanel.style.display = 'none';
        }
      });

      parent.appendChild(toggleBtn);
    });
  }

  mountLeafletMap(containerId) {
    if (this.mapInstance) {
      // Re-mount container to map object
      document.getElementById(containerId).appendChild(this.mapInstance.getContainer());
      this.mapInstance.invalidateSize();
      this.refreshMapPoints();
      return;
    }

    const venue = this.getActiveVenueDetails();
    const centerCoords = venue ? [venue.latitude, venue.longitude] : [40.8135, -74.0743];

    // Instantiate Leaflet Map
    const L = window.L;
    this.mapInstance = L.map(containerId, {
      zoomControl: true,
      maxZoom: 18,
      minZoom: 10
    }).setView(centerCoords, 14);

    // Initialize MapTiler Street tiles layer using provided key
    L.tileLayer(`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${CONFIG.MAPS_API_KEY}`, {
      attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      crossOrigin: true
    }).addTo(this.mapInstance);

    this.markersGroup = L.layerGroup().addTo(this.mapInstance);

    // Setup map search handlers
    document.querySelectorAll('.map-search-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const input = e.target.parentNode.querySelector('.map-search-input').value.trim().toLowerCase();
        this.searchMapFacilities(input);
      });
    });

    this.refreshMapPoints();
  }

  refreshMapPoints() {
    if (!this.mapInstance) return;
    const L = window.L;
    const venue = this.getActiveVenueDetails();
    if (!venue) return;

    this.markersGroup.clearLayers();

    // Center view
    this.mapInstance.setView([venue.latitude, venue.longitude], 14);

    // 1. Stadium Anchor Marker
    this.stadiumMarker = L.marker([venue.latitude, venue.longitude], {
      icon: L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: var(--accent-green); width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.5);"></div>`,
        iconSize: [14, 14]
      })
    }).addTo(this.markersGroup)
      .bindPopup(`<strong>${venue.name}</strong><br>${venue.address}`)
      .openPopup();

    // 2. User Position Marker
    if (this.userCoords) {
      this.userMarker = L.marker(this.userCoords, {
        icon: L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px #3b82f6;"></div>`,
          iconSize: [12, 12]
        })
      }).addTo(this.markersGroup)
        .bindPopup(`<strong>Your Position</strong><br>Estimated coordinates`);
    }

    // 3. Map facilities (Offset simulated markers around stadium)
    const facilities = [
      { name: "Main Parking Lot A", type: "parking", offset: [0.003, 0.003] },
      { name: "Secondary Parking K", type: "parking", offset: [-0.004, -0.003] },
      { name: "Inglewood Metro Rail Link", type: "metro", offset: [0.006, -0.004] },
      { name: "East Bus Concourse", type: "bus", offset: [-0.005, 0.005] },
      { name: "Emergency Medical Center 1", type: "medical", offset: [0.001, -0.001] },
      { name: "ADA Washrooms Sec 100", type: "washroom", offset: [-0.001, 0.002] },
      { name: "MetLife VIP Restaurant Lounge", type: "restaurant", offset: [0.002, -0.002] },
      { name: "Concourse Official Merch Shop", type: "merchandise", offset: [-0.002, 0.001] },
      { name: "Main Access Gate D", type: "gate", offset: [0.002, 0.003] },
      { name: "Emergency Evacuation Exit 4", type: "exit", offset: [0.004, 0.001] }
    ];

    facilities.forEach(fac => {
      const color = fac.type === 'medical' ? '#ef4444' : (fac.type === 'parking' ? '#eab308' : '#10b981');
      L.marker([venue.latitude + fac.offset[0], venue.longitude + fac.offset[1]], {
        icon: L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: ${color}; width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid white;"></div>`,
          iconSize: [10, 10]
        })
      }).addTo(this.markersGroup)
        .bindPopup(`<strong>${fac.name}</strong><br>Category: ${fac.type.toUpperCase()}`);
    });

    // 4. Draw animated route polyline
    this.drawAnimatedRoute();
  }

  drawAnimatedRoute() {
    if (!this.mapInstance || !this.userCoords) return;
    const L = window.L;
    const venue = this.getActiveVenueDetails();
    if (!venue) return;

    if (this.routePath) {
      this.mapInstance.removeLayer(this.routePath);
    }

    // Set animated route from user coordinates to active gate
    this.routePath = L.polyline([this.userCoords, [venue.latitude, venue.longitude]], {
      color: 'var(--accent-green)',
      weight: 4,
      dashArray: '8, 8',
      className: 'leaflet-route-animated'
    }).addTo(this.mapInstance);
  }

  searchMapFacilities(query) {
    if (!this.mapInstance) return;
    const L = window.L;
    let found = false;

    this.markersGroup.eachLayer(layer => {
      if (layer instanceof L.Marker && layer !== this.stadiumMarker && layer !== this.userMarker) {
        const text = layer.getPopup().getContent().toLowerCase();
        if (text.includes(query)) {
          layer.openPopup();
          this.mapInstance.setView(layer.getLatLng(), 15);
          found = true;
        }
      }
    });

    if (!found) {
      toast.show(`No facility matching "${query}" found near stadium bounds.`, "warn");
    }
  }

  // ----------------------------------------------------
  // TEXT TO SPEECH (TTS) SCREEN READER
  // ----------------------------------------------------
  setupSpeechSynthesis() {
    if (!window.speechSynthesis) {
      this.speechSynthesis = null;
      console.warn("Speech Synthesis API is not supported on this browser.");
      return;
    }
    this.speechSynthesis = window.speechSynthesis;
    
    // Setup controls if screen reader option is active
    globalState.subscribe('accessibility', (val) => {
      if (!val || !val.guide) {
        if (this.speechSynthesis) this.speechSynthesis.cancel();
      }
    });
  }

  speakResponse(text, langCode = 'en') {
    if (!this.speechSynthesis) return;
    
    // Stop any active utterance
    this.speechSynthesis.cancel();

    const isVoiceGuide = globalState.get('accessibility')?.guide || true;
    if (!isVoiceGuide) return;

    this.speechUtterance = new SpeechSynthesisUtterance(text);
    
    // Set matching voice if available
    const voices = this.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => v.lang.startsWith(langCode));
    if (matchedVoice) {
      this.speechUtterance.voice = matchedVoice;
    }

    // Adjust rate and pitch based on accessibility variables
    this.speechUtterance.rate = 1.0; 
    this.speechUtterance.pitch = 1.0; 

    this.speechSynthesis.speak(this.speechUtterance);
  }

  // ----------------------------------------------------
  // SPEECH TO TEXT (STT) MIC REC
  // ----------------------------------------------------
  setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const micBtn = document.getElementById('voice-input-btn');
      if (micBtn) micBtn.style.display = 'none';
      console.warn("Speech Recognition API is not supported on this browser. Hiding voice button.");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;

    this.recognition.onstart = () => {
      this.isListening = true;
      const micBtn = document.getElementById('voice-input-btn');
      if (micBtn) micBtn.classList.add('stt-listening-active');
      toast.show("Voice Input: Listening...", "info");
    };

    this.recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      console.log("Voice Recognition Success:", text);
      
      const input = document.getElementById('chat-user-input');
      if (input) {
        input.value = text;
        // Automatically submit chat
        if (window.sendAssistantChatMessage) {
          window.sendAssistantChatMessage();
        }
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      const micBtn = document.getElementById('voice-input-btn');
      if (micBtn) micBtn.classList.remove('stt-listening-active');
    };

    this.recognition.onerror = (event) => {
      console.warn("Speech Recognition Error:", event.error);
      toast.show(`Voice input failed: ${event.error}`, "error");
    };
  }

  toggleVoiceInput() {
    if (!this.recognition) {
      toast.show("Speech Recognition is not supported on this browser.", "warn");
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
    } else {
      // Get current assistant language to align recognition locale
      const activeLang = document.getElementById('assistant-lang-picker')?.value || 'en';
      this.recognition.lang = activeLang;
      this.recognition.start();
    }
  }

  // ----------------------------------------------------
  // ROBUST TIMEOUT & CACHING FETCHER (API HARDENING)
  // ----------------------------------------------------
  async fetchWithTimeoutAndCache(url, cacheKey, cacheExpiryMs = 60000, timeoutMs = 8000) {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < cacheExpiryMs) {
          return data;
        }
      }
    } catch (e) {
      console.warn("Session cache read error:", e.message);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!res.ok) throw new Error(`HTTP status ${res.status}`);
      const data = await res.json();
      
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data }));
      } catch (e) {
        console.warn("Session cache write error:", e.message);
      }
      
      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      
      // Fallback to expired cached data if available
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          console.log(`Failed to fetch fresh data for key ${cacheKey}. Using expired cache fallback.`);
          return JSON.parse(cached).data;
        }
      } catch (e) {}
      
      throw err;
    }
  }

  // ----------------------------------------------------
  // WEATHER, FOOTBALL, NEWS DATA POLLERS
  // ----------------------------------------------------
  startLiveDataPollers() {
    this.refreshLiveData();
    setInterval(() => this.refreshLiveData(), 45000);
  }

  async refreshLiveData() {
    await this.refreshWeatherTelemetry();
    await this.refreshFootballMatches();
    await this.refreshNewsArticles();
  }

  async refreshWeatherTelemetry() {
    const venue = this.getActiveVenueDetails();
    if (!venue) return;

    const tempVal = document.getElementById('weather-temp-val');
    const condBadge = document.getElementById('weather-cond-badge');
    const detailsVal = document.getElementById('weather-details-val');
    const sunRow = document.getElementById('weather-sun-row');

    try {
      const cacheKey = `weather_data_${venue.stadiumId}`;
      const url = `${CONFIG.API_BASE_URL}/weather?lat=${venue.latitude}&lon=${venue.longitude}`;
      // Weather cached for 10 minutes (600,000 ms)
      const data = await this.fetchWithTimeoutAndCache(url, cacheKey, 600000);
      
      if (!data || !data.success) throw new Error("Invalid weather data payload");

      if (condBadge) condBadge.textContent = data.condition;
      if (tempVal) tempVal.textContent = `${data.temperature}°C`;
      if (detailsVal) detailsVal.textContent = `Humidity: ${data.humidity}% | Wind: ${data.windSpeed} m/s | UV: ${data.uvIndex}`;
      if (sunRow) sunRow.innerHTML = `<span>Sunrise: ${data.sunrise}</span><span>Sunset: ${data.sunset}</span>`;

      globalState.set('weather', `${data.temperature}°C, ${data.condition}`);
    } catch (e) {
      console.warn("Could not retrieve weather telemetry:", e.message);
      if (tempVal && (tempVal.textContent.includes('Loading') || tempVal.textContent.includes('Offline'))) {
        tempVal.textContent = "Offline";
        if (detailsVal) detailsVal.textContent = "Weather data temporarily unavailable";
      }
    }
  }

  async refreshFootballMatches() {
    const teamsVal = document.getElementById('match-teams-val');
    const scoreVal = document.getElementById('match-score-val');
    const matchBadge = document.getElementById('match-status-badge');
    const statsRow = document.getElementById('match-stats-row');

    try {
      const cacheKey = 'football_live_matches';
      const url = `${CONFIG.API_BASE_URL}/football`;
      // Match details cached for 60 seconds
      const data = await this.fetchWithTimeoutAndCache(url, cacheKey, 60000);
      
      if (!data || !data.success || !data.matches || data.matches.length === 0) {
        throw new Error("No live match matches available");
      }

      const activeMatch = data.matches[0];
      
      if (matchBadge) {
        matchBadge.textContent = activeMatch.status;
        matchBadge.className = `sim-cc-badge ${activeMatch.status === 'LIVE' ? 'danger' : 'nominal'}`;
      }
      if (teamsVal) teamsVal.textContent = `${activeMatch.homeTeam.name} vs ${activeMatch.awayTeam.name}`;
      if (scoreVal) scoreVal.textContent = `Score: ${activeMatch.score.fullTime.home} - ${activeMatch.score.fullTime.away} ${activeMatch.minute ? '('+activeMatch.minute+')' : ''}`;
      if (statsRow) statsRow.innerHTML = `<span>Possession: ${activeMatch.stats?.possession?.home || 50}% - ${activeMatch.stats?.possession?.away || 50}%</span><span>Venue: ${activeMatch.venue}</span>`;
    } catch (e) {
      console.warn("Could not retrieve football matches:", e.message);
      if (teamsVal && (teamsVal.textContent.includes('Loading') || teamsVal.textContent.includes('Offline'))) {
        teamsVal.textContent = "Offline";
        if (scoreVal) scoreVal.textContent = "Live football feed temporarily offline";
      }
    }
  }

  async refreshNewsArticles() {
    const headlineVal = document.getElementById('news-headline-val');
    const descVal = document.getElementById('news-desc-val');

    try {
      const queryInput = document.getElementById('news-search-input')?.value || "";
      const cacheKey = `news_feed_query_${queryInput || 'default'}`;
      const url = `${CONFIG.API_BASE_URL}/news?q=${encodeURIComponent(queryInput || "FIFA World Cup 2026")}`;
      // News cached for 15 minutes (900,000 ms)
      const data = await this.fetchWithTimeoutAndCache(url, cacheKey, 900000);
      
      if (!data || !data.success || !data.articles || data.articles.length === 0) {
        throw new Error("No news articles matching query");
      }

      const activeArt = data.articles[Math.floor(Math.random() * data.articles.length)];
      
      if (headlineVal) headlineVal.textContent = activeArt.title;
      if (descVal) descVal.textContent = activeArt.description;
    } catch (e) {
      console.warn("Could not retrieve news articles:", e.message);
      if (headlineVal && (headlineVal.textContent.includes('Loading') || headlineVal.textContent.includes('Offline'))) {
        headlineVal.textContent = "Offline";
        if (descVal) descVal.textContent = "Tournament news updates temporarily unavailable";
      }
    }
  }

  // ----------------------------------------------------
  // TRANSLATE THE MAIN DOM LABELS & WIDGETS DYNAMICALLY
  // ----------------------------------------------------
  async translateDashboardTexts(targetLang) {
    if (this.translationTimeout) clearTimeout(this.translationTimeout);
    
    return new Promise((resolve) => {
      this.translationTimeout = setTimeout(async () => {
        await this._executeTranslation(targetLang);
        resolve();
      }, 500);
    });
  }

  async _executeTranslation(targetLang) {
    if (!this.translationCache) this.translationCache = {};

    const selectElements = [
      { selector: '.sim-cc-card-title', name: 'Card Title' },
      { selector: '.sim-timeline-title', name: 'Timeline Title' },
      { selector: '.sim-cc-subtext', name: 'Card Description' }
    ];

    if (targetLang === 'en') {
      toast.show("Resetting dashboard to English layout.", "info");
      for (const item of selectElements) {
        const nodes = document.querySelectorAll(item.selector);
        for (const node of nodes) {
          const original = node.getAttribute('data-orig-text');
          if (original) node.textContent = original;
        }
      }
      return;
    }

    toast.show("Translating dashboard details via Google Gemini...", "info");

    for (const item of selectElements) {
      const nodes = document.querySelectorAll(item.selector);
      for (const node of nodes) {
        let text = node.getAttribute('data-orig-text');
        if (!text) {
          text = node.textContent.trim();
          node.setAttribute('data-orig-text', text);
        }

        if (text && text.length > 2 && !text.includes('°C') && !text.includes(':')) {
          const cacheKey = `${targetLang}_${text}`;
          let translatedText = this.translationCache[cacheKey];

          if (!translatedText) {
            try {
              translatedText = await aiService.translateText(text, targetLang);
              if (translatedText) {
                this.translationCache[cacheKey] = translatedText;
              }
            } catch (e) {
              console.warn(`Gemini translation failed for text: ${text}`, e.message);
              translatedText = text;
            }
          }

          if (translatedText) {
            node.textContent = translatedText;
          }
        }
      }
    }
  }

  // ----------------------------------------------------
  // HELPERS
  // ----------------------------------------------------
  getActiveVenueDetails() {
    const venueKey = globalState.get('activeVenueKey') || 'estadio-azteca';
    return this.stadiumsDb.find(s => s.stadiumId === venueKey) || this.stadiumsDb[0];
  }

  updateActiveVenueTelemetry() {
    this.updateDistanceTelemetry();
    this.refreshWeatherTelemetry();
    if (this.mapInstance) {
      this.refreshMapPoints();
    }
    
    // Update active stadium card fields dynamically
    const activeStadium = this.getActiveVenueDetails();
    if (activeStadium) {
      const imgEl = document.getElementById('active-stadium-img');
      const nameEl = document.getElementById('active-stadium-name-lbl');
      const cityEl = document.getElementById('active-stadium-city-lbl');
      const capEl = document.getElementById('active-stadium-cap-lbl');
      const descEl = document.getElementById('active-stadium-desc-lbl');
      const metroEl = document.getElementById('active-stadium-metro-lbl');
      const homeEl = document.getElementById('active-stadium-home-lbl');

      if (imgEl) {
        imgEl.loading = 'lazy';
        const primaryPath = activeStadium.images?.[0] || '';
        let fallbackPath = 'assets/images/stadium_hero.png';
        if (activeStadium.stadiumId === 'metlife-stadium') fallbackPath = 'assets/images/metlife.png';
        else if (activeStadium.stadiumId === 'sofi-stadium') fallbackPath = 'assets/images/sofi.png';
        else if (activeStadium.stadiumId === 'estadio-azteca') fallbackPath = 'assets/images/azteca.png';
        
        // Probe image path and set src accordingly
        const testImg = new Image();
        testImg.onload = () => {
          imgEl.src = primaryPath;
        };
        testImg.onerror = () => {
          imgEl.src = fallbackPath;
        };
        testImg.src = primaryPath;
      }
      
      if (nameEl) nameEl.textContent = activeStadium.name;
      if (cityEl) cityEl.textContent = `${activeStadium.city}, ${activeStadium.country}`;
      if (capEl) capEl.textContent = `${parseInt(activeStadium.capacity).toLocaleString()} CAP`;
      if (descEl) descEl.textContent = activeStadium.description;
      if (metroEl) metroEl.textContent = activeStadium.nearestMetro || 'N/A';
      if (homeEl) homeEl.textContent = activeStadium.homeTeam || 'N/A';
    }
  }

  setupLightboxGallery() {
    const imgEl = document.getElementById('active-stadium-img');
    const lightbox = document.getElementById('stadium-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');
    const lightboxCaption = document.getElementById('lightbox-caption');

    if (!imgEl || !lightbox || !lightboxImg) return;

    let currentIndex = 0;
    let galleryImages = [];

    const updateLightboxImage = () => {
      const primaryPath = galleryImages[currentIndex];
      const activeStadium = this.getActiveVenueDetails();
      let fallbackPath = 'assets/images/stadium_hero.png';
      
      if (currentIndex === 0 && activeStadium) {
        if (activeStadium.stadiumId === 'metlife-stadium') fallbackPath = 'assets/images/metlife.png';
        else if (activeStadium.stadiumId === 'sofi-stadium') fallbackPath = 'assets/images/sofi.png';
        else if (activeStadium.stadiumId === 'estadio-azteca') fallbackPath = 'assets/images/azteca.png';
      }

      // Probe image path
      const testImg = new Image();
      testImg.onload = () => {
        lightboxImg.src = primaryPath;
      };
      testImg.onerror = () => {
        lightboxImg.src = fallbackPath;
      };
      testImg.src = primaryPath;

      if (lightboxCaption && activeStadium) {
        lightboxCaption.textContent = `${activeStadium.name} - View ${currentIndex + 1} of ${galleryImages.length}`;
      }
    };

    imgEl.style.cursor = 'pointer';
    imgEl.title = 'Click to open gallery lightbox';

    imgEl.addEventListener('click', () => {
      const activeStadium = this.getActiveVenueDetails();
      if (!activeStadium) return;

      galleryImages = activeStadium.images || [];
      if (galleryImages.length === 0) return;

      currentIndex = 0;
      updateLightboxImage();
      
      lightbox.style.display = 'flex';
      setTimeout(() => {
        lightbox.style.opacity = '1';
      }, 10);
    });

    const closeLightbox = () => {
      lightbox.style.opacity = '0';
      setTimeout(() => {
        lightbox.style.display = 'none';
      }, 300);
    };

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    if (lightboxPrev) {
      lightboxPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
        updateLightboxImage();
      });
    }

    if (lightboxNext) {
      lightboxNext.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex + 1) % galleryImages.length;
        updateLightboxImage();
      });
    }
  }
}

export const apiIntegration = new ApiIntegration();
