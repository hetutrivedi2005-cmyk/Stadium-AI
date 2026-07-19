import { CONFIG } from './config.js';
import { apiClient } from './utils/api-client.js';
import { globalState } from './state/global-state.js';
import { authService } from './services/authService.js';
import { apiService, VENUE_TELEMETRY_MOCK } from './services/api-service.js';
import { aiService } from './services/ai-service.js';
import { AuthUi } from './ui/auth-ui.js';
import { toast } from './ui/toast.js';
import { ProtectedRoute } from './routes/ProtectedRoute.js';
import { apiIntegration } from './services/api-integration.js';

// Dynamic Style Injection for Premium AI Chat Experience
const premiumChatStyles = document.createElement('style');
premiumChatStyles.textContent = `
  @keyframes bubbleFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .chat-bubble {
    animation: bubbleFadeIn 0.25s ease-out forwards;
    position: relative;
  }
  .chat-bubble.assistant {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .chat-copy-btn {
    align-self: flex-end;
    font-size: 0.7rem;
    color: var(--text-muted, #94a3b8);
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 2px 4px;
    margin-top: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 3px;
    transition: all 0.2s;
  }
  .chat-copy-btn:hover {
    color: var(--text-primary, #ffffff);
    background: rgba(255, 255, 255, 0.08);
  }
  .chat-retry-bubble {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 1rem !important;
    background: rgba(239, 68, 68, 0.1) !important;
    border: 1px solid rgba(239, 68, 68, 0.2) !important;
  }
  .chat-retry-btn {
    background: var(--color-danger, #ef4444);
    color: white;
    border: none;
    padding: 4px 12px;
    font-size: 0.75rem;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.2s;
  }
  .chat-retry-btn:hover {
    opacity: 0.9;
    transform: scale(1.02);
  }
`;
document.head.appendChild(premiumChatStyles);

// ----------------------------------------------------
// SYSTEM SETTINGS & STATES
// ----------------------------------------------------
const VENUES = ['Munich Bay', 'Forza d\'Attica', 'MetLife Stadium', 'Azteca Mexico', 'SoFi Stadium'];
let currentVenueIndex = 0;

// Initialize Auth Controller globally
window.stadiumAiAuthUi = new AuthUi();

// Initialize Protected Route Guard
ProtectedRoute.init();

// Theme toggle
const themeBtn = document.getElementById('theme-toggle-btn');
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const activeTheme = document.documentElement.getAttribute('data-theme');
    const nextTheme = activeTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem(CONFIG.THEME_STORAGE_KEY, nextTheme);
    
    // Repaint canvases
    initRadar();
    initQueueCanvas();
    if (typeof initCircularCanvas === 'function') initCircularCanvas();
    if (typeof initNavCanvas === 'function') initNavCanvas();
  });
}

// FAQ Accordion
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach(item => {
  const trigger = item.querySelector('.faq-trigger');
  if (trigger) {
    trigger.addEventListener('click', () => {
      const isExpanded = item.classList.contains('expanded');
      faqItems.forEach(i => {
        i.classList.remove('expanded');
        const trig = i.querySelector('.faq-trigger');
        if (trig) trig.setAttribute('aria-expanded', 'false');
      });
      if (!isExpanded) {
        item.classList.add('expanded');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  }
});

// Shortcut S key listener
window.addEventListener('keydown', (e) => {
  if (e.key === 's' || e.key === 'S') {
    const demoSection = document.getElementById('try-it');
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: 'smooth' });
    }
  }
});

// ----------------------------------------------------
// LIVE DATA TICKER SIMULATOR
// ----------------------------------------------------
let stateData = globalState.getState();

function animateCountValue(el, start, end, duration = 800) {
  if (!el) return;
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    el.textContent = Math.floor(progress * (end - start) + start).toLocaleString();
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      el.textContent = end.toLocaleString();
    }
  };
  window.requestAnimationFrame(step);
}

function flashHighlight(el) {
  if (!el) return;
  el.classList.add('stat-glow-highlight');
  setTimeout(() => {
    el.classList.remove('stat-glow-highlight');
  }, 1000);
}

let prevAttendance = globalState.get('metrics').attendance;
let prevThroughput = globalState.get('metrics').throughput;
let prevLanguages = globalState.get('metrics').languagesAssists;

setInterval(() => {
  // Update State metrics
  let attendance = globalState.get('metrics').attendance + Math.floor(Math.random() * 9) - 3;
  attendance = Math.max(85000, Math.min(90000, attendance));
  globalState.setNested('metrics', 'attendance', attendance);
  
  let throughput = globalState.get('metrics').throughput + Math.floor(Math.random() * 11) - 5;
  throughput = Math.max(1000, Math.min(1500, throughput));
  globalState.setNested('metrics', 'throughput', throughput);
  
  const sla = parseFloat((98.0 + Math.random() * 1.5).toFixed(1));
  globalState.setNested('metrics', 'throughputSla', sla);

  let assists = globalState.get('metrics').languagesAssists;
  if (Math.random() > 0.8) {
    assists = assists + 1;
    globalState.setNested('metrics', 'languagesAssists', assists);
  }

  // Update DOM from State
  const attEl = document.getElementById('stat-attendance');
  if (attEl) {
    if (attendance !== prevAttendance) {
      animateCountValue(attEl, prevAttendance, attendance, 800);
      flashHighlight(attEl);
      prevAttendance = attendance;
    }
  }

  const rateEl = document.getElementById('stat-attendance-rate');
  if (rateEl) {
    const rate = Math.floor(2100 + Math.random() * 100);
    rateEl.textContent = rate.toLocaleString();
  }

  const thrEl = document.getElementById('stat-throughput');
  if (thrEl) {
    if (throughput !== prevThroughput) {
      flashHighlight(thrEl);
      thrEl.textContent = `${throughput.toLocaleString()} / min`;
      prevThroughput = throughput;
    }
  }

  const slaEl = document.getElementById('stat-throughput-sla');
  if (slaEl) slaEl.textContent = `${sla}%`;

  const langEl = document.getElementById('stat-languages');
  if (langEl) {
    if (assists !== prevLanguages) {
      animateCountValue(langEl, prevLanguages, assists, 500);
      flashHighlight(langEl);
      prevLanguages = assists;
    }
  }
}, 3000);

// Rotate venue indicator in header
setInterval(() => {
  currentVenueIndex = (currentVenueIndex + 1) % VENUES.length;
  const venueEl = document.getElementById('active-venue-name');
  if (venueEl) venueEl.textContent = VENUES[currentVenueIndex];
}, 10000);

// ----------------------------------------------------
// RADAR CANVAS CONTROLLER
// ----------------------------------------------------
let radarCanvas, radarCtx, radarAnimationId;
let activeFeatureIndex = 0;
const featureItems = document.querySelectorAll('.feature-item');

const radarModes = [
  { name: 'Sense', speed: 0.015, pointsCount: 42, showArrows: false, alertBlobs: false },
  { name: 'Predict', speed: 0.01, pointsCount: 20, showArrows: false, alertBlobs: true },
  { name: 'Orchestrate', speed: 0.02, pointsCount: 15, showArrows: true, alertBlobs: false },
  { name: 'Audit', speed: 0.005, pointsCount: 8, showArrows: false, alertBlobs: false }
];

featureItems.forEach(item => {
  item.addEventListener('click', () => {
    featureItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    activeFeatureIndex = parseInt(item.getAttribute('data-feature'));
    initRadarMode();
  });
});

function initRadar() {
  radarCanvas = document.getElementById('radar-canvas');
  if (!radarCanvas) return;
  radarCtx = radarCanvas.getContext('2d');
  
  const dpr = window.devicePixelRatio || 1;
  const rect = radarCanvas.getBoundingClientRect();
  radarCanvas.width = rect.width * dpr;
  radarCanvas.height = rect.height * dpr;
  radarCtx.scale(dpr, dpr);
  
  initRadarMode();
}

let radarSweepAngle = 0;
let radarPoints = [];
let flowArrows = [];
let alertBlobs = [];

function initRadarMode() {
  const mode = radarModes[activeFeatureIndex];
  const w = radarCanvas.width / (window.devicePixelRatio || 1);
  const h = radarCanvas.height / (window.devicePixelRatio || 1);
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(cx, cy) * 0.8;

  const overlayText = document.getElementById('radar-venue-label');
  if (overlayText) {
    if (activeFeatureIndex === 0) overlayText.textContent = "VENUE - FORZA D'ATTICA / SENSORY NETWORK";
    else if (activeFeatureIndex === 1) overlayText.textContent = "VENUE - FORZA D'ATTICA / PREDICTIVE FLUX";
    else if (activeFeatureIndex === 2) overlayText.textContent = "VENUE - FORZA D'ATTICA / ORCHESTRATION LINKS";
    else overlayText.textContent = "VENUE - FORZA D'ATTICA / AUDIT LOG ARCHIVE";
  }

  radarPoints = [];
  for (let i = 0; i < mode.pointsCount; i++) {
    const r = Math.random() * radius;
    const angle = Math.random() * Math.PI * 2;
    radarPoints.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      brightness: Math.random(),
      size: 1.5 + Math.random() * 2,
      pulseSpeed: 0.02 + Math.random() * 0.05
    });
  }

  flowArrows = [];
  if (mode.showArrows) {
    for (let i = 0; i < 8; i++) {
      const startAngle = Math.random() * Math.PI * 2;
      const r1 = radius * 0.9;
      const r2 = radius * 0.2;
      flowArrows.push({
        x1: cx + r1 * Math.cos(startAngle),
        y1: cy + r1 * Math.sin(startAngle),
        x2: cx + r2 * Math.cos(startAngle + 0.5),
        y2: cy + r2 * Math.sin(startAngle + 0.5),
        progress: Math.random()
      });
    }
  }

  alertBlobs = [];
  if (mode.alertBlobs) {
    for (let i = 0; i < 3; i++) {
      const r = radius * (0.3 + Math.random() * 0.4);
      const angle = Math.random() * Math.PI * 2;
      alertBlobs.push({
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        maxRadius: 30 + Math.random() * 40,
        currRadius: 1,
        pulse: 0
      });
    }
  }
}

function drawRadar() {
  if (!radarCanvas || !radarCtx) return;
  
  const theme = document.documentElement.getAttribute('data-theme');
  const w = radarCanvas.width / (window.devicePixelRatio || 1);
  const h = radarCanvas.height / (window.devicePixelRatio || 1);
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(cx, cy) * 0.8;
  const mode = radarModes[activeFeatureIndex];

  radarCtx.clearRect(0, 0, w, h);

  // 1. Grid Circles
  radarCtx.strokeStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(9, 13, 22, 0.04)';
  radarCtx.lineWidth = 1;
  
  for (let r = radius / 4; r <= radius; r += radius / 4) {
    radarCtx.beginPath();
    radarCtx.arc(cx, cy, r, 0, Math.PI * 2);
    radarCtx.stroke();
  }

  radarCtx.beginPath();
  radarCtx.moveTo(cx - radius, cy);
  radarCtx.lineTo(cx + radius, cy);
  radarCtx.moveTo(cx, cy - radius);
  radarCtx.lineTo(cx, cy + radius);
  radarCtx.stroke();

  radarCtx.strokeStyle = theme === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(9, 13, 22, 0.08)';
  radarCtx.lineWidth = 1.5;
  radarCtx.beginPath();
  radarCtx.arc(cx, cy, radius, 0, Math.PI * 2);
  radarCtx.stroke();

  // 2. Heatmap Blobs
  if (mode.alertBlobs) {
    alertBlobs.forEach(blob => {
      blob.pulse += 0.01;
      const sizeOsc = Math.sin(blob.pulse) * 10;
      const rad = Math.abs(blob.maxRadius + sizeOsc);
      
      let grd = radarCtx.createRadialGradient(blob.x, blob.y, 2, blob.x, blob.y, rad);
      grd.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
      grd.addColorStop(0.5, 'rgba(245, 158, 11, 0.1)');
      grd.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      radarCtx.fillStyle = grd;
      radarCtx.beginPath();
      radarCtx.arc(blob.x, blob.y, rad, 0, Math.PI * 2);
      radarCtx.fill();
    });
  }

  // 3. Flow Arrows
  if (mode.showArrows) {
    radarCtx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
    radarCtx.lineWidth = 2;
    flowArrows.forEach(arrow => {
      arrow.progress += 0.008;
      if (arrow.progress > 1) arrow.progress = 0;
      
      const px = arrow.x1 + (arrow.x2 - arrow.x1) * arrow.progress;
      const py = arrow.y1 + (arrow.y2 - arrow.y1) * arrow.progress;

      radarCtx.beginPath();
      radarCtx.moveTo(arrow.x1, arrow.y1);
      radarCtx.lineTo(px, py);
      radarCtx.strokeStyle = `rgba(16, 185, 129, ${0.1 + arrow.progress * 0.4})`;
      radarCtx.stroke();
      
      radarCtx.fillStyle = 'rgba(16, 185, 129, 0.8)';
      radarCtx.beginPath();
      radarCtx.arc(px, py, 3.5, 0, Math.PI * 2);
      radarCtx.fill();
    });
  }

  // 4. Sensors Points
  radarPoints.forEach(pt => {
    const angleToPt = Math.atan2(pt.y - cy, pt.x - cx);
    let normalizedSweep = radarSweepAngle % (Math.PI * 2);
    let normalizedPt = angleToPt;
    if (normalizedPt < 0) normalizedPt += Math.PI * 2;
    
    let angleDiff = normalizedSweep - normalizedPt;
    if (angleDiff < 0) angleDiff += Math.PI * 2;

    let alpha = 0.15;
    if (angleDiff < 1.0) {
      alpha = 1.0 - angleDiff;
    }

    pt.brightness += pt.pulseSpeed;
    const sizeMultiplier = 0.8 + 0.4 * Math.sin(pt.brightness);

    radarCtx.fillStyle = `rgba(0, 176, 80, ${alpha})`;
    radarCtx.beginPath();
    radarCtx.arc(pt.x, pt.y, pt.size * sizeMultiplier, 0, Math.PI * 2);
    radarCtx.fill();

    if (alpha > 0.6) {
      radarCtx.fillStyle = '#FFFFFF';
      radarCtx.beginPath();
      radarCtx.arc(pt.x, pt.y, 0.8, 0, Math.PI * 2);
      radarCtx.fill();
    }
  });

  // 5. Audit Overlay text
  if (activeFeatureIndex === 3) {
    radarCtx.fillStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.85)' : '#090D16';
    radarCtx.font = `11px ${varText('font-mono')}`;
    const lines = [
      'SEC_102: PASSAGE STOPS OK',
      'GATE_A: THROUGHPUT CAP 98.4%',
      'AUTO_SOP_04: FIRED',
      'TRANSIT: LINK 04 DISPATCHED'
    ];
    lines.forEach((line, idx) => {
      radarCtx.fillText(`> ${line}`, cx - radius + 15, cy - radius + 50 + idx * 18);
    });
  }

  // 6. Sweep Line
  radarSweepAngle += mode.speed;
  const sweepX = cx + radius * Math.cos(radarSweepAngle);
  const sweepY = cy + radius * Math.sin(radarSweepAngle);

  radarCtx.beginPath();
  radarCtx.moveTo(cx, cy);
  for (let i = 0; i < 40; i++) {
    const a = radarSweepAngle - i * 0.015;
    const sx = cx + radius * Math.cos(a);
    const sy = cy + radius * Math.sin(a);
    radarCtx.lineTo(sx, sy);
  }
  radarCtx.closePath();
  
  let sweepGrad = radarCtx.createRadialGradient(cx, cy, 10, cx, cy, radius);
  sweepGrad.addColorStop(0, 'rgba(0, 176, 80, 0.08)');
  sweepGrad.addColorStop(1, 'rgba(0, 176, 80, 0)');
  radarCtx.fillStyle = sweepGrad;
  radarCtx.fill();

  radarCtx.strokeStyle = 'rgba(0, 176, 80, 0.35)';
  radarCtx.lineWidth = 1.5;
  radarCtx.beginPath();
  radarCtx.moveTo(cx, cy);
  radarCtx.lineTo(sweepX, sweepY);
  radarCtx.stroke();

  radarAnimationId = requestAnimationFrame(drawRadar);
}

function varText(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
}

// ----------------------------------------------------
// DEEP DIVE QUEUE FLOW SIMULATOR (CANVAS)
// ----------------------------------------------------
let queueCanvas, queueCtx, queueAnimationId;
let particles = [];
const gates = [
  { name: 'GATE A', y: 80, processing: false, flash: 0 },
  { name: 'GATE B', y: 180, processing: false, flash: 0 },
  { name: 'GATE C', y: 280, processing: false, flash: 0 },
  { name: 'GATE D', y: 380, processing: false, flash: 0 }
];

function initQueueCanvas() {
  queueCanvas = document.getElementById('queue-canvas');
  if (!queueCanvas) return;
  queueCtx = queueCanvas.getContext('2d');
  
  const dpr = window.devicePixelRatio || 1;
  const rect = queueCanvas.getBoundingClientRect();
  queueCanvas.width = rect.width * dpr;
  queueCanvas.height = rect.height * dpr;
  queueCtx.scale(dpr, dpr);

  particles = [];
  for (let i = 0; i < 20; i++) {
    particles.push({
      x: Math.random() * (rect.width - 150) + 50,
      gateIndex: Math.floor(Math.random() * 4),
      speed: 1.2 + Math.random() * 1.5,
      active: true
    });
  }
}

function drawQueueFlow() {
  if (!queueCanvas || !queueCtx) return;

  const theme = document.documentElement.getAttribute('data-theme');
  const w = queueCanvas.width / (window.devicePixelRatio || 1);
  const h = queueCanvas.height / (window.devicePixelRatio || 1);
  
  queueCtx.clearRect(0, 0, w, h);

  queueCtx.strokeStyle = theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(9,13,22,0.03)';
  queueCtx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < w; x += gridSize) {
    queueCtx.beginPath();
    queueCtx.moveTo(x, 0);
    queueCtx.lineTo(x, h);
    queueCtx.stroke();
  }
  for (let y = 0; y < h; y += gridSize) {
    queueCtx.beginPath();
    queueCtx.moveTo(0, y);
    queueCtx.lineTo(w, y);
    queueCtx.stroke();
  }

  gates.forEach((gate, idx) => {
    queueCtx.font = `11px ${varText('font-mono')}`;
    queueCtx.fillStyle = varText('text-muted');
    queueCtx.fillText(gate.name, 40, gate.y - 12);
    
    queueCtx.strokeStyle = theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(9,13,22,0.07)';
    queueCtx.lineWidth = 2;
    queueCtx.beginPath();
    queueCtx.moveTo(40, gate.y);
    queueCtx.lineTo(w - 120, gate.y);
    queueCtx.stroke();

    const sensorX = w * 0.75;
    if (gate.flash > 0) {
      gate.flash -= 0.05;
    }

    queueCtx.fillStyle = gate.flash > 0 
      ? `rgba(0, 176, 80, ${0.2 + gate.flash * 0.6})` 
      : (theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(9,13,22,0.05)');
    queueCtx.strokeStyle = gate.flash > 0 ? 'var(--accent-green)' : 'var(--border-color)';
    queueCtx.lineWidth = 1.5;
    
    queueCtx.beginPath();
    queueCtx.roundRect(sensorX - 25, gate.y - 15, 50, 30, 4);
    queueCtx.fill();
    queueCtx.stroke();

    queueCtx.fillStyle = gate.flash > 0 ? 'var(--accent-green)' : varText('text-secondary');
    queueCtx.font = `9px ${varText('font-mono')}`;
    queueCtx.textAlign = 'center';
    queueCtx.fillText(gate.flash > 0 ? 'PASS' : 'SCAN', sensorX, gate.y + 4);
    queueCtx.textAlign = 'left';
  });

  if (Math.random() > 0.92) {
    particles.push({
      x: 40,
      gateIndex: Math.floor(Math.random() * 4),
      speed: 1.4 + Math.random() * 1.6,
      active: true
    });
  }

  const sensorX = w * 0.75;

  particles.forEach(p => {
    const gate = gates[p.gateIndex];
    p.x += p.speed;

    if (Math.abs(p.x - sensorX) < p.speed && p.active) {
      gate.flash = 1.0;
    }

    queueCtx.fillStyle = p.x > sensorX ? 'var(--accent-green)' : varText('text-muted');
    queueCtx.beginPath();
    queueCtx.arc(p.x, gate.y, 4, 0, Math.PI * 2);
    queueCtx.fill();

    if (p.x > sensorX) {
      queueCtx.strokeStyle = 'rgba(0, 176, 80, 0.2)';
      queueCtx.lineWidth = 1;
      queueCtx.beginPath();
      queueCtx.arc(p.x, gate.y, 8, 0, Math.PI * 2);
      queueCtx.stroke();
    }
  });

  particles = particles.filter(p => p.x < w - 60);
  queueAnimationId = requestAnimationFrame(drawQueueFlow);
}

// ----------------------------------------------------
// COUNTER NUMBERS PAGE LOAD ANIMATION
// ----------------------------------------------------
function animateCounters() {
  const counters = [
    { id: 'counter-nodes', start: 0, target: 2400, suffix: '', duration: 1500 },
    { id: 'counter-update', start: 0, target: 10, suffix: ' Hz', duration: 1000 },
    { id: 'counter-error', start: 0, target: 4.2, suffix: ' %', duration: 1200, isFloat: true },
    { id: 'counter-uptime', start: 0, target: 99.99, suffix: ' %', duration: 1800, isFloat: true }
  ];

  counters.forEach(c => {
    const element = document.getElementById(c.id);
    if (!element) return;
    
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / c.duration, 1);
      
      let currentVal = progress * (c.target - c.start) + c.start;
      if (c.isFloat) {
        element.textContent = (c.id === 'counter-error' ? '± ' : '') + currentVal.toFixed(c.id === 'counter-uptime' ? 2 : 1) + c.suffix;
      } else {
        element.textContent = Math.floor(currentVal).toLocaleString() + c.suffix;
      }

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  });
}

let countersAnimated = false;
window.addEventListener('scroll', () => {
  const ddSection = document.getElementById('deep-dive');
  if (ddSection && !countersAnimated) {
    const rect = ddSection.getBoundingClientRect();
    const isInView = (rect.top <= window.innerHeight * 0.75);
    if (isInView) {
      animateCounters();
      countersAnimated = true;
    }
  }
});

// ----------------------------------------------------
// INTERACTIVE SIMULATOR (CIRCULAR MAP)
// ----------------------------------------------------
let circularCanvas, circularCtx, circularAnimationId;
let stadiumSeats = [];
let stadiumFlowParticles = [];
let sensorPulse = 0;
let hoveredBlock = null;
const SECTOR_KEYS = ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'];

const toggleMitigation = document.getElementById('sim-mitigation-toggle');
const venueSelectBtn = document.getElementById('sim-venue-select-btn');
const venueDropdown = document.getElementById('sim-venue-dropdown-menu');
const tooltipEl = document.getElementById('stadium-tooltip-el');

if (toggleMitigation) {
  toggleMitigation.addEventListener('change', async () => {
    const statusText = document.getElementById('sim-mitigation-status-desc');
    const venueKey = globalState.get('activeVenueKey');
    const block = globalState.get('selectedBlock');
    
    if (toggleMitigation.checked) {
      statusText.textContent = 'Engaging AI signage control paths...';
      statusText.style.color = 'var(--accent-green)';
      
      // Call service API mitigation endpoint
      const sector = await apiService.updateMitigationMode(venueKey, block, true);
      statusText.textContent = 'Engaged and operating signage controls';
      updateSimulatorPanel();
    } else {
      statusText.textContent = 'Overriding control systems...';
      statusText.style.color = 'var(--accent-red)';
      
      const sector = await apiService.updateMitigationMode(venueKey, block, false);
      statusText.textContent = 'Overridden • Operational manual control';
      updateSimulatorPanel();
    }
  });
}

if (venueSelectBtn) {
  venueSelectBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (venueDropdown) venueDropdown.classList.toggle('active');
  });
}

document.addEventListener('click', () => {
  if (venueDropdown) venueDropdown.classList.remove('active');
});

const venueOpts = document.querySelectorAll('.sim-venue-opt');
venueOpts.forEach(opt => {
  opt.addEventListener('click', async () => {
    venueOpts.forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
    
    const venueKey = opt.getAttribute('data-venue');
    globalState.set('activeVenueKey', venueKey);
    
    // Fetch sectors data from API
    const data = await apiService.getSectorsTelemetry(venueKey);
    const venueName = data.name;
    
    if (venueSelectBtn) venueSelectBtn.textContent = venueName;
    document.getElementById('active-venue-name').textContent = venueName;
    document.getElementById('sim-crowd-venue-lbl').textContent = venueName;
    document.getElementById('sim-nav-venue-lbl').textContent = venueName;
    
    updateSimulatorPanel();
    initCircularCanvas();
    initNavCanvas();
  });
});

const layerBtns = document.querySelectorAll('.layer-btn');
layerBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    layerBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const layer = btn.getAttribute('data-layer');
    globalState.set('activeLayer', layer);
    stadiumFlowParticles = [];
  });
});

// Update State Listener for layer selection
globalState.subscribe('activeLayer', (val) => {
  // Sync local variable
});

function updateSimulatorPanel() {
  const venueKey = globalState.get('activeVenueKey');
  const block = globalState.get('selectedBlock');
  const data = VENUE_TELEMETRY_MOCK[venueKey].data[block];
  
  document.getElementById('sim-active-block-id').textContent = data.name;
  document.getElementById('sim-active-block-capacity').textContent = `${parseInt(data.capacity).toLocaleString()} people`;
  
  const densityVal = document.getElementById('sim-metric-density-val');
  const densityBar = document.getElementById('sim-metric-density-bar');
  densityVal.textContent = `${data.density}%`;
  densityBar.style.width = `${data.density}%`;

  if (data.density > 85) {
    densityBar.style.backgroundColor = 'var(--accent-red)';
    densityVal.style.color = 'var(--accent-red)';
  } else if (data.density > 65) {
    densityBar.style.backgroundColor = 'var(--accent-orange)';
    densityVal.style.color = 'var(--accent-orange)';
  } else {
    densityBar.style.backgroundColor = 'var(--accent-green)';
    densityVal.style.color = 'var(--accent-green)';
  }

  document.getElementById('sim-metric-dwell').textContent = data.dwell;
  
  const forecastVal = document.getElementById('sim-metric-forecast');
  if (forecastVal.textContent.startsWith('+')) {
    forecastVal.style.color = 'var(--accent-red)';
  } else {
    forecastVal.style.color = 'var(--accent-green)';
  }
  document.getElementById('sim-metric-playbook').textContent = data.playbook;
}

function generateCircularSeats(cx, cy, radius) {
  stadiumSeats = [];
  const R_inner = radius * 0.42;
  const R_outer = radius * 0.9;
  
  for (let s = 0; s < 8; s++) {
    const sectorKey = SECTOR_KEYS[s];
    const startAngle = s * Math.PI / 4 - Math.PI / 8;
    const endAngle = (s + 1) * Math.PI / 4 - Math.PI / 8;
    
    const numRows = 5;
    for (let r = 0; r < numRows; r++) {
      const rRadius = R_inner + 12 + (r / (numRows - 1)) * (R_outer - R_inner - 24);
      const arcLength = rRadius * (Math.PI / 4);
      const seatSpacing = 8.5;
      const numSeats = Math.max(3, Math.floor(arcLength / seatSpacing));
      
      for (let j = 0; j < numSeats; j++) {
        const angleMargin = 0.025;
        const theta = startAngle + angleMargin + (j / (numSeats - 1 || 1)) * (endAngle - startAngle - angleMargin * 2);
        
        stadiumSeats.push({
          x: cx + rRadius * Math.cos(theta),
          y: cy + rRadius * Math.sin(theta),
          sector: sectorKey,
          rand: Math.random(),
          pulseOffset: Math.random() * Math.PI * 2
        });
      }
    }
  }
}

function initCircularCanvas() {
  circularCanvas = document.getElementById('stadium-circular-canvas');
  if (!circularCanvas) return;
  circularCtx = circularCanvas.getContext('2d');
  
  const dpr = window.devicePixelRatio || 1;
  const rect = circularCanvas.getBoundingClientRect();
  if (rect.width === 0) {
    setTimeout(initCircularCanvas, 50);
    return;
  }
  circularCanvas.width = rect.width * dpr;
  circularCanvas.height = rect.height * dpr;
  circularCtx.scale(dpr, dpr);
  
  const w = rect.width;
  const h = rect.height;
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(cx, cy) * 0.85;
  
  generateCircularSeats(cx, cy, radius);
  
  circularCanvas.removeEventListener('mousemove', onCanvasMouseMove);
  circularCanvas.addEventListener('mousemove', onCanvasMouseMove);
  
  circularCanvas.removeEventListener('mouseleave', onCanvasMouseLeave);
  circularCanvas.addEventListener('mouseleave', onCanvasMouseLeave);

  circularCanvas.removeEventListener('click', onCanvasClick);
  circularCanvas.addEventListener('click', onCanvasClick);
}

function getSectorFromPos(mx, my) {
  if (!circularCanvas) return null;
  const rect = circularCanvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(cx, cy) * 0.85;
  
  const dx = mx - cx;
  const dy = my - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  const R_inner = radius * 0.42;
  const R_outer = radius * 0.9;
  
  if (dist >= R_inner && dist <= R_outer) {
    const angle = Math.atan2(dy, dx);
    let normalizedAngle = angle;
    if (normalizedAngle < 0) normalizedAngle += Math.PI * 2;
    
    let shifted = (normalizedAngle + Math.PI / 8) % (Math.PI * 2);
    let sectorIdx = Math.floor(shifted / (Math.PI / 4));
    return SECTOR_KEYS[sectorIdx];
  }
  return null;
}

function onCanvasMouseMove(e) {
  if (!circularCanvas) return;
  const rect = circularCanvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  
  const sector = getSectorFromPos(mx, my);
  hoveredBlock = sector;
  
  if (sector) {
    circularCanvas.style.cursor = 'pointer';
    
    const venueKey = globalState.get('activeVenueKey');
    const venueData = VENUE_TELEMETRY_MOCK[venueKey].data[sector];
    document.getElementById('tooltip-sec-name').textContent = venueData.name;
    document.getElementById('tooltip-sec-capacity').textContent = parseInt(venueData.capacity).toLocaleString();
    document.getElementById('tooltip-sec-density').textContent = `${venueData.density}%`;
    
    const flowVal = document.getElementById('tooltip-sec-flow');
    if (venueData.density > 85) {
      flowVal.textContent = 'Severe Bottleneck';
      flowVal.style.color = 'var(--accent-red)';
    } else if (venueData.density > 65) {
      flowVal.textContent = 'Slow Flow';
      flowVal.style.color = 'var(--accent-orange)';
    } else {
      flowVal.textContent = 'Normal';
      flowVal.style.color = 'var(--accent-green)';
    }
    
    if (tooltipEl) {
      tooltipEl.style.opacity = '1';
      tooltipEl.style.left = `${mx + 15}px`;
      tooltipEl.style.top = `${my + 15}px`;
    }
  } else {
    circularCanvas.style.cursor = 'default';
    if (tooltipEl) tooltipEl.style.opacity = '0';
  }
}

function onCanvasMouseLeave() {
  hoveredBlock = null;
  if (tooltipEl) tooltipEl.style.opacity = '0';
}

function onCanvasClick(e) {
  if (!circularCanvas) return;
  const rect = circularCanvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  
  const sector = getSectorFromPos(mx, my);
  if (sector) {
    globalState.set('selectedBlock', sector);
    updateSimulatorPanel();
  }
}

function drawCircularStadium() {
  if (!circularCanvas || !circularCtx) return;
  
  const theme = document.documentElement.getAttribute('data-theme');
  const w = circularCanvas.width / (window.devicePixelRatio || 1);
  const h = circularCanvas.height / (window.devicePixelRatio || 1);
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(cx, cy) * 0.85;
  
  const R_inner = radius * 0.42;
  const R_middle = radius * 0.68;
  const R_outer = radius * 0.9;
  
  circularCtx.clearRect(0, 0, w, h);
  
  const borderVal = varText('border-color');
  const accentGreen = varText('accent-green');
  const accentOrange = varText('accent-orange');
  const accentRed = varText('accent-red');

  const gatesPos = [
    { x: cx, y: cy - R_middle, angle: 3 * Math.PI / 2 },
    { x: cx + R_middle, y: cy, angle: 0 },
    { x: cx, y: cy + R_middle, angle: Math.PI / 2 },
    { x: cx - R_middle, y: cy, angle: Math.PI }
  ];

  const selectedBlock = globalState.get('selectedBlock');
  const venueKey = globalState.get('activeVenueKey');
  const activeLayer = globalState.get('activeLayer');

  for (let s = 0; s < 8; s++) {
    const sectorKey = SECTOR_KEYS[s];
    const startAngle = s * Math.PI / 4 - Math.PI / 8;
    const endAngle = (s + 1) * Math.PI / 4 - Math.PI / 8;
    const venueData = VENUE_TELEMETRY_MOCK[venueKey].data[sectorKey];
    
    let fillStyle = 'transparent';
    
    if (sectorKey === selectedBlock) {
      if (venueData.density > 85) fillStyle = 'rgba(239, 68, 68, 0.12)';
      else if (venueData.density > 65) fillStyle = 'rgba(245, 158, 11, 0.12)';
      else fillStyle = 'rgba(0, 176, 80, 0.12)';
    } else if (sectorKey === hoveredBlock) {
      if (venueData.density > 85) fillStyle = 'rgba(239, 68, 68, 0.08)';
      else if (venueData.density > 65) fillStyle = 'rgba(245, 158, 11, 0.08)';
      else fillStyle = 'rgba(0, 176, 80, 0.08)';
    } else {
      fillStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.015)' : 'rgba(9, 13, 22, 0.015)';
    }
    
    circularCtx.fillStyle = fillStyle;
    circularCtx.beginPath();
    circularCtx.arc(cx, cy, R_outer, startAngle, endAngle);
    circularCtx.arc(cx, cy, R_inner, endAngle, startAngle, true);
    circularCtx.closePath();
    circularCtx.fill();
    
    circularCtx.strokeStyle = borderVal;
    circularCtx.lineWidth = 1;
    circularCtx.beginPath();
    circularCtx.moveTo(cx + R_inner * Math.cos(startAngle), cy + R_inner * Math.sin(startAngle));
    circularCtx.lineTo(cx + R_outer * Math.cos(startAngle), cy + R_outer * Math.sin(startAngle));
    circularCtx.stroke();
  }

  circularCtx.strokeStyle = borderVal;
  circularCtx.lineWidth = 1;
  circularCtx.beginPath(); circularCtx.arc(cx, cy, R_outer, 0, Math.PI * 2); circularCtx.stroke();
  circularCtx.beginPath(); circularCtx.arc(cx, cy, R_middle, 0, Math.PI * 2); circularCtx.stroke();
  circularCtx.beginPath(); circularCtx.arc(cx, cy, R_inner, 0, Math.PI * 2); circularCtx.stroke();
  
  circularCtx.save();
  circularCtx.translate(cx, cy);
  const pitchW = R_inner * 1.15;
  const pitchH = R_inner * 0.78;
  circularCtx.fillStyle = theme === 'dark' ? 'rgba(0, 176, 80, 0.05)' : 'rgba(0, 176, 80, 0.03)';
  circularCtx.strokeStyle = theme === 'dark' ? 'rgba(0, 176, 80, 0.35)' : 'rgba(0, 176, 80, 0.25)';
  circularCtx.lineWidth = 1.5;
  circularCtx.beginPath();
  circularCtx.roundRect(-pitchW / 2, -pitchH / 2, pitchW, pitchH, 6);
  circularCtx.fill(); circularCtx.stroke();
  circularCtx.beginPath();
  circularCtx.arc(0, 0, R_inner * 0.15, 0, Math.PI * 2);
  circularCtx.moveTo(0, -pitchH / 2);
  circularCtx.lineTo(0, pitchH / 2);
  circularCtx.stroke();
  circularCtx.restore();

  if (activeLayer === 'density') {
    stadiumSeats.forEach(seat => {
      const venueData = VENUE_TELEMETRY_MOCK[venueKey].data[seat.sector];
      const isOccupied = (seat.rand * 100) < venueData.density;
      
      if (isOccupied) {
        let seatColor = accentGreen;
        if (venueData.density > 85) {
          const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.005 + seat.pulseOffset);
          seatColor = `rgba(239, 68, 68, ${pulse})`;
        } else if (venueData.density > 65) {
          seatColor = accentOrange;
        } else {
          seatColor = theme === 'dark' ? 'rgba(16, 185, 129, 0.85)' : 'rgba(0, 176, 80, 0.85)';
        }
        
        circularCtx.fillStyle = seatColor;
        circularCtx.beginPath();
        circularCtx.arc(seat.x, seat.y, (seat.sector === selectedBlock || seat.sector === hoveredBlock) ? 2.0 : 1.5, 0, Math.PI * 2);
        circularCtx.fill();
      } else {
        circularCtx.fillStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(9, 13, 22, 0.06)';
        circularCtx.beginPath();
        circularCtx.arc(seat.x, seat.y, 1.2, 0, Math.PI * 2);
        circularCtx.fill();
      }
    });
  } else if (activeLayer === 'flow') {
    stadiumSeats.forEach(seat => {
      circularCtx.fillStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(9, 13, 22, 0.03)';
      circularCtx.beginPath(); circularCtx.arc(seat.x, seat.y, 1.2, 0, Math.PI * 2); circularCtx.fill();
    });

    if (stadiumFlowParticles.length < 90 && Math.random() > 0.3) {
      const s = Math.floor(Math.random() * 8);
      const startAngle = s * Math.PI / 4 - Math.PI / 8 + Math.random() * Math.PI / 4;
      const rRadius = R_inner + 5 + Math.random() * (R_outer - R_inner - 10);
      const gateAngle = Math.round(startAngle / (Math.PI / 2)) * (Math.PI / 2);
      
      stadiumFlowParticles.push({
        startR: rRadius,
        startAngle: startAngle,
        currR: rRadius,
        currAngle: startAngle,
        gateAngle: gateAngle,
        gateR: R_middle,
        progress: 0,
        speed: 0.012 + Math.random() * 0.008,
        stage: 1,
        alpha: 0.85
      });
    }
    
    stadiumFlowParticles.forEach(p => {
      if (p.stage === 1) {
        p.progress += p.speed;
        if (p.progress >= 1) {
          p.progress = 0; p.stage = 2;
          p.currAngle = p.gateAngle; p.currR = p.gateR;
        } else {
          p.currAngle = p.startAngle + (p.gateAngle - p.startAngle) * p.progress;
          p.currR = p.startR + (p.gateR - p.startR) * p.progress;
        }
      } else {
        p.currR += 1.8; p.alpha -= 0.025;
      }
      
      const px = cx + p.currR * Math.cos(p.currAngle);
      const py = cy + p.currR * Math.sin(p.currAngle);
      
      circularCtx.fillStyle = `rgba(0, 176, 80, ${p.alpha})`;
      circularCtx.beginPath(); circularCtx.arc(px, py, 2.5, 0, Math.PI * 2); circularCtx.fill();
      
      circularCtx.strokeStyle = `rgba(0, 176, 80, ${p.alpha * 0.25})`;
      circularCtx.lineWidth = 1.5;
      circularCtx.beginPath();
      const tailL = 5;
      const tailAngle = p.stage === 1 ? p.currAngle - 0.05 : p.currAngle;
      const dx = Math.cos(tailAngle) * tailL * (p.stage === 1 ? -1 : 1);
      const dy = Math.sin(tailAngle) * tailL * (p.stage === 1 ? -1 : 1);
      circularCtx.moveTo(px + dx, py + dy); circularCtx.lineTo(px, py); circularCtx.stroke();
    });
    stadiumFlowParticles = stadiumFlowParticles.filter(p => p.alpha > 0 && p.currR < radius * 1.15);
  } else if (activeLayer === 'sensors') {
    sensorPulse += 0.035;
    const pulseRatio = (Math.sin(sensorPulse) + 1) / 2;
    
    circularCtx.fillStyle = theme === 'dark' ? '#FAF9F6' : '#090D16';
    circularCtx.beginPath(); circularCtx.arc(cx, cy, 6, 0, Math.PI * 2); circularCtx.fill();
    
    circularCtx.strokeStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(9, 13, 22, 0.3)';
    circularCtx.lineWidth = 1;
    circularCtx.beginPath(); circularCtx.arc(cx, cy, 10, 0, Math.PI * 2); circularCtx.stroke();

    gatesPos.forEach(g => {
      circularCtx.strokeStyle = 'rgba(0, 176, 80, 0.15)';
      circularCtx.lineWidth = 1.5;
      circularCtx.setLineDash([4, 4]);
      circularCtx.beginPath(); circularCtx.moveTo(cx, cy); circularCtx.lineTo(g.x, g.y); circularCtx.stroke();
      
      const wRadius = R_middle * ((sensorPulse * 0.3) % 1.0);
      const wx = cx + wRadius * Math.cos(g.angle);
      const wy = cy + wRadius * Math.sin(g.angle);
      
      circularCtx.setLineDash([]);
      circularCtx.fillStyle = accentGreen;
      circularCtx.beginPath(); circularCtx.arc(wx, wy, 2.5, 0, Math.PI * 2); circularCtx.fill();
    });

    for (let s = 0; s < 8; s++) {
      const sectorKey = SECTOR_KEYS[s];
      const midAngle = s * Math.PI / 4;
      const sectorR = (R_inner + R_outer) / 2;
      const sx = cx + sectorR * Math.cos(midAngle);
      const sy = cy + sectorR * Math.sin(midAngle);
      
      const gateIdx = Math.round(midAngle / (Math.PI / 2)) % 4;
      const gate = gatesPos[gateIdx];
      
      circularCtx.strokeStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(9, 13, 22, 0.08)';
      circularCtx.lineWidth = 1;
      circularCtx.setLineDash([2, 3]);
      circularCtx.beginPath(); circularCtx.moveTo(gate.x, gate.y); circularCtx.lineTo(sx, sy); circularCtx.stroke();
      
      circularCtx.setLineDash([]);
      const isSelected = (sectorKey === selectedBlock);
      const venueData = VENUE_TELEMETRY_MOCK[venueKey].data[sectorKey];
      let color = theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(9, 13, 22, 0.3)';
      if (venueData.density > 85) color = accentRed;
      else if (venueData.density > 65) color = accentOrange;
      else if (isSelected) color = accentGreen;
      
      circularCtx.fillStyle = color;
      circularCtx.beginPath(); circularCtx.arc(sx, sy, isSelected ? 4.5 : 3, 0, Math.PI * 2); circularCtx.fill();
      
      if (isSelected) {
        circularCtx.strokeStyle = color;
        circularCtx.lineWidth = 1;
        circularCtx.beginPath(); circularCtx.arc(sx, sy, 8 + pulseRatio * 6, 0, Math.PI * 2); circularCtx.stroke();
      }
    }
    circularCtx.setLineDash([]);
  }

  gatesPos.forEach(g => {
    circularCtx.fillStyle = '#090D16';
    circularCtx.beginPath(); circularCtx.arc(g.x, g.y, 5.5, 0, Math.PI * 2); circularCtx.fill();
    circularCtx.strokeStyle = '#FFFFFF';
    circularCtx.lineWidth = 2;
    circularCtx.beginPath(); circularCtx.arc(g.x, g.y, 5.5, 0, Math.PI * 2); circularCtx.stroke();
  });

  circularAnimationId = requestAnimationFrame(drawCircularStadium);
}

// ----------------------------------------------------
// SMART NAVIGATION VIEWPORT (TAB COORD CANVAS)
// ----------------------------------------------------
let navCanvas, navCtx;
let navSeats = [];
let pathPulseTime = 0;

function initNavCanvas() {
  navCanvas = document.getElementById('stadium-nav-canvas');
  if (!navCanvas) return;
  navCtx = navCanvas.getContext('2d');
  
  const dpr = window.devicePixelRatio || 1;
  const rect = navCanvas.getBoundingClientRect();
  if (rect.width === 0) {
    setTimeout(initNavCanvas, 50);
    return;
  }
  navCanvas.width = rect.width * dpr;
  navCanvas.height = rect.height * dpr;
  navCtx.scale(dpr, dpr);
  
  const w = rect.width;
  const h = rect.height;
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(cx, cy) * 0.85;
  
  navSeats = [];
  const R_inner = radius * 0.42;
  const R_outer = radius * 0.9;
  
  for (let s = 0; s < 8; s++) {
    const sectorKey = SECTOR_KEYS[s];
    const startAngle = s * Math.PI / 4 - Math.PI / 8;
    const endAngle = (s + 1) * Math.PI / 4 - Math.PI / 8;
    const numRows = 5;
    for (let r = 0; r < numRows; r++) {
      const rRadius = R_inner + 12 + (r / (numRows - 1)) * (R_outer - R_inner - 24);
      const arcLength = rRadius * (Math.PI / 4);
      const seatSpacing = 8.5;
      const numSeats = Math.max(3, Math.floor(arcLength / seatSpacing));
      for (let j = 0; j < numSeats; j++) {
        const angleMargin = 0.025;
        const theta = startAngle + angleMargin + (j / (numSeats - 1 || 1)) * (endAngle - startAngle - angleMargin * 2);
        navSeats.push({
          x: cx + rRadius * Math.cos(theta),
          y: cy + rRadius * Math.sin(theta),
          sector: sectorKey
        });
      }
    }
  }
}

async function calculateRoute() {
  const emptyEl = document.getElementById('nav-empty-state');
  const cardsEl = document.getElementById('nav-route-options');
  if (emptyEl) emptyEl.style.display = 'none';
  if (cardsEl) cardsEl.style.display = 'flex';
  
  globalState.set('activePathRoute', 'fastest');
  
  // Call transit API
  const transit = await apiService.getTransitStatus();
  
  const baseTime = Math.floor(4 + Math.random() * 5);
  const fastestVal = document.getElementById('route-eta-fastest');
  const uncrowdedVal = document.getElementById('route-eta-uncrowded');
  const accessibleVal = document.getElementById('route-eta-accessible');
  const emergencyVal = document.getElementById('route-eta-emergency');
  
  if (fastestVal) fastestVal.textContent = `${baseTime}m`;
  if (uncrowdedVal) uncrowdedVal.textContent = `${baseTime + 2}m`;
  if (accessibleVal) accessibleVal.textContent = `${baseTime + 5}m`;
  if (emergencyVal) emergencyVal.textContent = `2m`;
  
  selectRoute('fastest');

  // Render step-by-step directions dynamically
  const directionsEl = document.getElementById('nav-route-directions');
  const directionsList = document.getElementById('nav-directions-list');
  if (directionsEl && directionsList) {
    directionsEl.style.display = 'block';
    
    const startVal = document.getElementById('route-start').value;
    const endVal = document.getElementById('route-end').value;
    
    const startNames = {
      'gate-a': 'Gate A Entrance',
      'gate-b': 'Gate B Entrance',
      'parking-a': 'Parking Zone A',
      'parking-d': 'Parking Zone D'
    };
    const endNames = {
      'north': 'North Stand (Seat 101)',
      'east': 'East Stand (Seat 204)',
      'south': 'South Stand (Seat 301)',
      'west': 'West Stand (Seat 401)',
      'food-b': 'Food Court B',
      'washroom-ne': 'Washroom NE',
      'medical-se': 'Medical Station SE'
    };

    const startLabel = startNames[startVal] || 'Start';
    const endLabel = endNames[endVal] || 'Destination';

    directionsList.innerHTML = `
      <li style="display: flex; align-items: flex-start; gap: 8px;">
        <span style="color: var(--accent-green); font-weight: 700;">1.</span>
        <span>Depart from <strong>${startLabel}</strong> and follow the glowing line path.</span>
      </li>
      <li style="display: flex; align-items: flex-start; gap: 8px;">
        <span style="color: var(--accent-green); font-weight: 700;">2.</span>
        <span>Advance through secure ticket scanning checkpoint (current queue wait time: <strong><span id="nav-gate-wait">2m</span></strong>).</span>
      </li>
      <li style="display: flex; align-items: flex-start; gap: 8px;">
        <span style="color: var(--accent-green); font-weight: 700;">3.</span>
        <span>Take the concourse ramp towards sector <strong>${endVal.toUpperCase()}</strong>.</span>
      </li>
      <li style="display: flex; align-items: flex-start; gap: 8px;">
        <span style="color: var(--accent-green); font-weight: 700;">4.</span>
        <span>Arrive at <strong>${endLabel}</strong>. Total estimated distance: <strong>320 meters</strong>.</span>
      </li>
    `;
  }
}

function simulateRideshareRequest() {
  const btn = document.getElementById('btn-request-rideshare');
  const badge = document.getElementById('rideshare-status-badge');
  const desc = document.getElementById('rideshare-desc');
  const countdown = document.getElementById('rideshare-countdown');
  const secVal = document.getElementById('rideshare-sec-val');

  if (!btn || !badge || !desc) return;

  btn.disabled = true;
  btn.textContent = "Connecting to Driver...";
  badge.textContent = "MATCHING";
  badge.style.background = "rgba(245, 158, 11, 0.15)";
  badge.style.color = "#F59E0B";
  badge.style.borderColor = "#F59E0B";

  setTimeout(() => {
    badge.textContent = "EN ROUTE";
    badge.style.background = "rgba(59, 130, 246, 0.15)";
    badge.style.color = "#3B82F6";
    badge.style.borderColor = "#3B82F6";
    btn.textContent = "Cancel Request";
    btn.disabled = false;
    btn.style.backgroundColor = "var(--accent-red)";
    btn.style.borderColor = "var(--accent-red)";

    desc.innerHTML = `<strong>Driver Matched:</strong> Carlos S. (Tesla Model Y - Electric Green Wrap) is dispatched to Rideshare Zone C.`;
    
    if (countdown && secVal) {
      countdown.style.display = 'block';
      let secondsLeft = 120;
      secVal.textContent = secondsLeft;
      
      if (window.rideshareInterval) clearInterval(window.rideshareInterval);
      
      window.rideshareInterval = setInterval(() => {
        secondsLeft--;
        secVal.textContent = secondsLeft;
        
        if (secondsLeft <= 0) {
          clearInterval(window.rideshareInterval);
          badge.textContent = "ARRIVED";
          badge.style.background = "rgba(74, 222, 128, 0.15)";
          badge.style.color = "#4ADE80";
          badge.style.borderColor = "#4ADE80";
          desc.innerHTML = `<strong>Carlos S.</strong> is waiting at Rideshare Zone C Lane 2. Walk to Gate B exit paths to board.`;
          countdown.style.display = 'none';
          btn.textContent = "Ride Completed";
          btn.style.backgroundColor = "";
          btn.style.borderColor = "";
          btn.disabled = true;
        }
      }, 1000);
    }
  }, 2000);

  btn.onclick = () => {
    if (btn.textContent === "Cancel Request") {
      if (window.rideshareInterval) clearInterval(window.rideshareInterval);
      badge.textContent = "CANCELLED";
      badge.style.background = "rgba(239, 68, 68, 0.15)";
      badge.style.color = "#EF4444";
      badge.style.borderColor = "#EF4444";
      desc.textContent = "Pickup cancelled by operator. Ready to dispatch new route request.";
      countdown.style.display = 'none';
      btn.textContent = "Request Egress Pickup";
      btn.style.backgroundColor = "";
      btn.style.borderColor = "";
      btn.onclick = simulateRideshareRequest;
    }
  };
}

function selectRoute(routeId) {
  globalState.set('activePathRoute', routeId);
  const routeCards = document.querySelectorAll('.route-card');
  routeCards.forEach(card => {
    card.classList.remove('active');
    if (card.getAttribute('data-route-id') === routeId) {
      card.classList.add('active');
    }
  });
}

function drawNavStadium() {
  if (!navCanvas || !navCtx) {
    requestAnimationFrame(drawNavStadium);
    return;
  }
  
  const isNavTabActive = document.getElementById('panel-stadium-nav').classList.contains('active');
  if (!isNavTabActive) {
    requestAnimationFrame(drawNavStadium);
    return;
  }
  
  const theme = document.documentElement.getAttribute('data-theme');
  const w = navCanvas.width / (window.devicePixelRatio || 1);
  const h = navCanvas.height / (window.devicePixelRatio || 1);
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(cx, cy) * 0.85;
  
  const R_inner = radius * 0.42;
  const R_middle = radius * 0.68;
  const R_outer = radius * 0.9;
  
  navCtx.clearRect(0, 0, w, h);
  
  const borderVal = varText('border-color');
  
  for (let s = 0; s < 8; s++) {
    const startAngle = s * Math.PI / 4 - Math.PI / 8;
    navCtx.strokeStyle = borderVal;
    navCtx.lineWidth = 1;
    navCtx.beginPath();
    navCtx.moveTo(cx + R_inner * Math.cos(startAngle), cy + R_inner * Math.sin(startAngle));
    navCtx.lineTo(cx + R_outer * Math.cos(startAngle), cy + R_outer * Math.sin(startAngle));
    navCtx.stroke();
  }
  
  navCtx.strokeStyle = borderVal;
  navCtx.beginPath(); navCtx.arc(cx, cy, R_outer, 0, Math.PI * 2); navCtx.stroke();
  navCtx.beginPath(); navCtx.arc(cx, cy, R_middle, 0, Math.PI * 2); navCtx.stroke();
  navCtx.beginPath(); navCtx.arc(cx, cy, R_inner, 0, Math.PI * 2); navCtx.stroke();
  
  navCtx.save();
  navCtx.translate(cx, cy);
  navCtx.fillStyle = theme === 'dark' ? 'rgba(0, 176, 80, 0.03)' : 'rgba(0, 176, 80, 0.02)';
  navCtx.strokeStyle = theme === 'dark' ? 'rgba(0, 176, 80, 0.2)' : 'rgba(0, 176, 80, 0.15)';
  navCtx.lineWidth = 1.5;
  navCtx.beginPath();
  navCtx.roundRect(-R_inner * 0.57, -R_inner * 0.39, R_inner * 1.14, R_inner * 0.78, 6);
  navCtx.fill(); navCtx.stroke();
  navCtx.restore();
  
  navSeats.forEach(seat => {
    navCtx.fillStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(9, 13, 22, 0.05)';
    navCtx.beginPath(); navCtx.arc(seat.x, seat.y, 1.2, 0, Math.PI * 2); navCtx.fill();
  });
  
  const activePathRoute = globalState.get('activePathRoute');

  if (activePathRoute) {
    pathPulseTime += 0.05;
    
    const startSelect = document.getElementById('route-start').value;
    const endSelect = document.getElementById('route-end').value;
    
    let startAngle = 0;
    if (startSelect === 'gate-b') startAngle = Math.PI / 2;
    else if (startSelect === 'parking-a') startAngle = Math.PI;
    else if (startSelect === 'parking-d') startAngle = 3 * Math.PI / 2;
    
    let endAngle = 0;
    let endR = R_middle;
    if (endSelect === 'north') { endAngle = 3 * Math.PI / 2; endR = R_outer - 15; }
    else if (endSelect === 'south') { endAngle = Math.PI / 2; endR = R_outer - 15; }
    else if (endSelect === 'west') { endAngle = Math.PI; endR = R_outer - 15; }
    else if (endSelect === 'east') { endAngle = 0; endR = R_outer - 15; }
    else if (endSelect === 'food-b') { endAngle = Math.PI / 4; endR = R_inner + 15; }
    else if (endSelect === 'washroom-ne') { endAngle = 7 * Math.PI / 4; endR = R_inner + 10; }
    else if (endSelect === 'medical-se') { endAngle = 3 * Math.PI / 4; endR = R_inner + 10; }
    
    const p1 = { x: cx + R_outer * Math.cos(startAngle), y: cy + R_outer * Math.sin(startAngle) };
    const p2 = { x: cx + R_middle * Math.cos(startAngle), y: cy + R_middle * Math.sin(startAngle) };
    const p3 = { x: cx + R_middle * Math.cos(endAngle), y: cy + R_middle * Math.sin(endAngle) };
    const p4 = { x: cx + endR * Math.cos(endAngle), y: cy + endR * Math.sin(endAngle) };
    
    let routeColor = 'var(--accent-green)';
    if (activePathRoute === 'uncrowded') routeColor = '#3B82F6';
    else if (activePathRoute === 'accessible') routeColor = '#8B5CF6';
    else if (activePathRoute === 'emergency') routeColor = 'var(--accent-red)';
    
    navCtx.shadowColor = routeColor;
    navCtx.shadowBlur = 8;
    navCtx.strokeStyle = routeColor;
    navCtx.lineWidth = 3.5;
    
    navCtx.beginPath();
    navCtx.moveTo(p1.x, p1.y);
    navCtx.lineTo(p2.x, p2.y);
    navCtx.arc(cx, cy, R_middle, startAngle, endAngle, (startAngle > endAngle));
    navCtx.lineTo(p4.x, p4.y);
    navCtx.stroke();
    
    navCtx.shadowBlur = 0;
    
    const segment = (pathPulseTime % 3.0) / 3.0;
    let pulsePos = { x: p1.x, y: p1.y };
    if (segment < 0.2) {
      const ratio = segment / 0.2;
      pulsePos.x = p1.x + (p2.x - p1.x) * ratio;
      pulsePos.y = p1.y + (p2.y - p1.y) * ratio;
    } else if (segment < 0.8) {
      const ratio = (segment - 0.2) / 0.6;
      const currentAngle = startAngle + (endAngle - startAngle) * ratio;
      pulsePos.x = cx + R_middle * Math.cos(currentAngle);
      pulsePos.y = cy + R_middle * Math.sin(currentAngle);
    } else {
      const ratio = (segment - 0.8) / 0.2;
      pulsePos.x = p3.x + (p4.x - p3.x) * ratio;
      pulsePos.y = p3.y + (p4.y - p3.y) * ratio;
    }
    
    navCtx.fillStyle = '#FAF9F6';
    navCtx.strokeStyle = routeColor;
    navCtx.lineWidth = 2.5;
    navCtx.beginPath(); navCtx.arc(pulsePos.x, pulsePos.y, 5, 0, Math.PI * 2); navCtx.fill(); navCtx.stroke();
    
    navCtx.fillStyle = routeColor;
    navCtx.beginPath(); navCtx.arc(p4.x, p4.y, 6.5 + Math.sin(pathPulseTime * 2.5) * 2, 0, Math.PI * 2); navCtx.fill();
    
    navCtx.fillStyle = '#090D16';
    navCtx.strokeStyle = borderVal;
    navCtx.lineWidth = 2;
    navCtx.beginPath(); navCtx.arc(p1.x, p1.y, 5, 0, Math.PI * 2); navCtx.fill(); navCtx.stroke();
  }
  
  requestAnimationFrame(drawNavStadium);
}

// Bind calculate routes triggers
window.calculateRoute = calculateRoute;
window.selectRoute = selectRoute;
window.simulateRideshareRequest = simulateRideshareRequest;

// ----------------------------------------------------
// CONSOLE TAB MENU CONTROLLER
// ----------------------------------------------------
const tabBtns = document.querySelectorAll('.console-tab-btn');
const tabPanels = document.querySelectorAll('.sim-tab-panel');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    tabPanels.forEach(p => p.classList.remove('active'));
    
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    const tabId = btn.getAttribute('data-tab');
    
    const panelEl = document.getElementById(`panel-${tabId}`);
    if (panelEl) panelEl.classList.add('active');
    
    if (tabId === 'crowd-intel') {
      initCircularCanvas();
    } else if (tabId === 'stadium-nav') {
      initNavCanvas();
    } else if (tabId === 'volunteer-copilot') {
      initCopilotMap();
    }
  });
});

// Command center timeline logging ticker
let ccAttendance = 81547;
let ccDensity = 82;

setInterval(async () => {
  ccAttendance += Math.floor(Math.random() * 7) - 3;
  const attEl = document.getElementById('cc-stat-attendance');
  if (attEl) attEl.textContent = ccAttendance.toLocaleString();
  
  if (Math.random() > 0.8) {
    ccDensity = Math.max(75, Math.min(95, ccDensity + (Math.random() > 0.5 ? 1 : -1)));
    const densEl = document.getElementById('cc-stat-density');
    if (densEl) densEl.textContent = `${ccDensity}%`;
    
    const gateValEl = document.getElementById('cc-gates-val');
    if (gateValEl) gateValEl.textContent = `Gate C: ${ccDensity > 84 ? 'Severe Density' : 'High Traffic'}`;
  }
  
  if (Math.random() > 0.85) {
    const logs = [
      "<strong>[INFO]</strong> Transport sync: Shuttle bus terminal 4 waiting time reduced.",
      "<strong>[INFO]</strong> Egress corridors in South Concourse reported nominal.",
      "<strong>[WARNING]</strong> Concession Stall 12 queue length rising. Crowd manager redirected.",
      "<strong>[INFO]</strong> Sector 220 responder reports dehydration case cleared.",
      "<strong>[ALERT]</strong> Parking Zone D EV charger line capacity reached."
    ];
    const randomLog = logs[Math.floor(Math.random() * logs.length)];
    // Call service to log incident
    await apiService.reportIncident(randomLog);
    
    syncIncidentTimeline();
  }
}, 3500);

function syncIncidentTimeline() {
  const logList = document.getElementById('cc-timeline-list');
  if (!logList) return;
  
  logList.innerHTML = '';
  const list = globalState.get('incidentsList');
  list.forEach(incident => {
    const div = document.createElement('div');
    div.className = `sim-timeline-item ${incident.isAlert ? 'alert' : ''}`;
    div.innerHTML = `<span class="sim-timeline-time">${incident.time}</span><span>${incident.msg}</span>`;
    logList.appendChild(div);
  });
}

// Initialize timeline load
syncIncidentTimeline();

// ----------------------------------------------------
// MULTILINGUAL AI ASSISTANT CHAT ENGINE
// ----------------------------------------------------
let activeAssistantLang = 'en';

function changeAssistantLanguage() {
  activeAssistantLang = document.getElementById('assistant-lang-picker').value;
  const chatFeed = document.getElementById('assistant-chat-messages');
  if (chatFeed) {
    // Import greeting map
    let greeting = "Hello! I am your AI Operations assistant. How can I help you manage the stadium today?";
    if (activeAssistantLang === 'es') greeting = "¡Hola! Soy tu asistente de operaciones de IA. ¿Cómo puedo ayudarte a gestionar el estadio hoy?";
    else if (activeAssistantLang === 'fr') greeting = "Bonjour! Je suis votre assistant d'exploitation IA. Comment puis-je vous aider à gérer le stade aujourd'hui?";
    else if (activeAssistantLang === 'pt') greeting = "Olá! Sou o seu assistente de operações de IA. Como posso ajudar a gerenciar o estádio hoje?";
    else if (activeAssistantLang === 'hi') greeting = "नमस्ते! मैं आपका एआई ऑपरेशंस सहायक हूँ। आज स्टेडियम प्रबंधन में मैं आपकी क्या मदद कर सकता हूँ?";
    else if (activeAssistantLang === 'ar') greeting = "مرحباً! أنا مساعد عمليات الذكاء الاصطناعي. كيف يمكنني مساعدتك في إدارة الاستاد اليوم؟";
    else if (activeAssistantLang === 'ja') greeting = "こんにちは！スタジアム運営AIアシスタントです。本日のスタジアム管理についてご用件をどうぞ？";
    else if (activeAssistantLang === 'de') greeting = "Hallo! Ich bin Ihr KI-Betriebsassistent. Wie kann ich Ihnen heute bei der Verwaltung des Stadions helfen?";

    chatFeed.innerHTML = `
      <div class="chat-bubble assistant">
        ${greeting}
      </div>
    `;
  }
  apiIntegration.translateDashboardTexts(activeAssistantLang);
}

function sendPromptChip(promptText) {
  const input = document.getElementById('chat-user-input');
  if (input) {
    input.value = promptText;
    sendAssistantChatMessage();
  }
}

function triggerVoiceSpeech() {
  apiIntegration.toggleVoiceInput();
}

function sendAssistantChatMessage() {
  const input = document.getElementById('chat-user-input');
  if (!input) return;
  const query = input.value.trim();
  if (!query) return;
  
  input.value = "";
  const chatFeed = document.getElementById('assistant-chat-messages');
  if (!chatFeed) return;
  
  const userBubble = document.createElement('div');
  userBubble.className = 'chat-bubble user';
  userBubble.textContent = query;
  chatFeed.appendChild(userBubble);
  chatFeed.scrollTop = chatFeed.scrollHeight;
  
  showAssistantReply(query);
}

async function showAssistantReply(query) {
  const chatFeed = document.getElementById('assistant-chat-messages');
  const input = document.getElementById('chat-user-input');
  const sendBtn = document.querySelector('.assistant-send-btn');
  if (!chatFeed) return;
  
  if (input) input.disabled = true;
  if (sendBtn) sendBtn.disabled = true;

  const typingBubble = document.createElement('div');
  typingBubble.className = 'chat-bubble assistant typing';
  typingBubble.style.display = 'flex';
  typingBubble.style.alignItems = 'center';
  typingBubble.style.gap = '6px';
  typingBubble.innerHTML = `
    <span style="font-size: 0.8rem; opacity: 0.7; font-style: italic; margin-right: 4px;">StadiumAI is thinking...</span>
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
  `;
  chatFeed.appendChild(typingBubble);
  chatFeed.scrollTop = chatFeed.scrollHeight;

  const lowerQuery = query.toLowerCase();
  let localResponse = null;

  if (lowerQuery.includes('gate d')) {
    localResponse = `<strong>[AI Security Routing]</strong> Gate D is currently experiencing elevated entry queues.<br>• Sector: <strong>South-East</strong><br>• Current Queue Wait: <strong>11 mins</strong><br>• Recommended Egress Path: Route guests to Gate C.<br><button class="btn" style="padding: 0.35rem 0.75rem; font-size: 0.65rem; margin-top: 8px; font-family: var(--font-mono);" onclick="globalState.set('selectedBlock', 'South-East'); updateSimulatorPanel(); toast.show('Focused: South-East Sector', 'info')">Highlight South-East Stand</button>`;
  } else if (lowerQuery.includes('parking')) {
    localResponse = `<strong>[AI Transit Hub]</strong> Live Parking Occupancy:<br>• Zone A: <strong>94% Full</strong> (Nearly saturated, routing incoming vehicles)<br>• Zone D (EV Chargers): <strong>62% Full</strong> (12 chargers available)<br><button class="btn" style="padding: 0.35rem 0.75rem; font-size: 0.65rem; margin-top: 8px; font-family: var(--font-mono);" onclick="globalState.set('selectedBlock', 'South'); updateSimulatorPanel(); toast.show('Focused: South Sector', 'info')">Show Parking-Adjacent Stands</button>`;
  } else if (lowerQuery.includes('section c')) {
    localResponse = `<strong>[AI Crowd Intel]</strong> Section C (East Stand) is currently at <strong>78% occupancy</strong>. Entry flow is moderate.<br>• Gate Designation: Gate B<br>• Nearest Facilities: Washroom NE (120m)<br><button class="btn" style="padding: 0.35rem 0.75rem; font-size: 0.65rem; margin-top: 8px; font-family: var(--font-mono);" onclick="globalState.set('selectedBlock', 'East'); updateSimulatorPanel(); toast.show('Focused: East Sector', 'info')">Inspect East Stand Twin</button>`;
  } else if (lowerQuery.includes('emergency') || lowerQuery.includes('exit')) {
    localResponse = `<strong>[AI Safety Playbook]</strong> Emergency routes are clear. Primary muster point is assembly Zone D.<br>• Sector Coordinates: West Ramp Bypass<br>• Security Status: Nominal<br><button class="btn" style="padding: 0.35rem 0.75rem; font-size: 0.65rem; margin-top: 8px; font-family: var(--font-mono); background-color: var(--accent-red); color: white; border-color: var(--accent-red);" onclick="triggerEmergencyAlert()">Trigger simulated SOS Dispatch</button>`;
  }
  
  try {
    let replyText;
    if (localResponse) {
      // Simulate natural typing lag for local operations responses
      await new Promise(resolve => setTimeout(resolve, 800));
      replyText = localResponse;
    } else {
      replyText = await aiService.sendAssistantQuery(query, activeAssistantLang);
    }

    if (chatFeed.contains(typingBubble)) {
      chatFeed.removeChild(typingBubble);
    }
    
    const replyBubble = document.createElement('div');
    replyBubble.className = 'chat-bubble assistant';
    
    const formattedText = replyText
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');

    replyBubble.innerHTML = `
      <div class="bubble-text">${formattedText}</div>
      <button class="chat-copy-btn" title="Copy Response">
        <svg style="width: 12px; height: 12px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        Copy
      </button>
    `;

    replyBubble.querySelector('.chat-copy-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(replyText);
      const btn = replyBubble.querySelector('.chat-copy-btn');
      btn.textContent = 'Copied!';
      setTimeout(() => {
        btn.innerHTML = `
          <svg style="width: 12px; height: 12px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          Copy
        `;
      }, 2000);
    });

    chatFeed.appendChild(replyBubble);
    chatFeed.scrollTop = chatFeed.scrollHeight;
    
    // Screen reader
    apiIntegration.speakResponse(replyText, activeAssistantLang);
  } catch (e) {
    if (chatFeed.contains(typingBubble)) {
      chatFeed.removeChild(typingBubble);
    }
    
    const errorBubble = document.createElement('div');
    errorBubble.className = 'chat-bubble assistant chat-retry-bubble';
    errorBubble.innerHTML = `
      <div style="font-size: 0.85rem; color: #ef4444; text-align: center; font-weight: 500;">Connection to StadiumAI command link failed.</div>
      <button class="chat-retry-btn">Retry Connection</button>
    `;
    errorBubble.querySelector('.chat-retry-btn').addEventListener('click', () => {
      if (chatFeed.contains(errorBubble)) {
        chatFeed.removeChild(errorBubble);
      }
      showAssistantReply(query);
    });
    chatFeed.appendChild(errorBubble);
    chatFeed.scrollTop = chatFeed.scrollHeight;
    
    toast.show("AI Assistant failed to retrieve answer", "error");
  } finally {
    if (input) {
      input.disabled = false;
      input.focus();
    }
    if (sendBtn) sendBtn.disabled = false;
  }
}

// Bind chat utilities to global window scope for HTML onclick bindings
window.changeAssistantLanguage = changeAssistantLanguage;
window.sendPromptChip = sendPromptChip;
window.triggerVoiceSpeech = triggerVoiceSpeech;
window.sendAssistantChatMessage = sendAssistantChatMessage;

// ----------------------------------------------------
// ACCESSIBILITY ACTIONS & EMERGENCY TRIGGER
// ----------------------------------------------------
function toggleAccessibility(type) {
  const btn = document.getElementById(`access-btn-${type}`);
  if (!btn) return;
  btn.classList.toggle('active');
  const isAct = btn.classList.contains('active');
  
  btn.textContent = isAct ? (type === 'scaling' ? 'Reset' : 'Disable') : (type === 'scaling' ? 'Enlarge' : (type === 'guide' ? 'Listen' : 'Enable'));
  
  // Set in state store
  globalState.setNested('accessibility', type, isAct);

  if (type === 'contrast') {
    document.body.classList.toggle('high-contrast-mode');
  } else if (type === 'scaling') {
    document.body.classList.toggle('text-scale-lg');
  } else if (type === 'voice') {
    if (isAct && 'speechSynthesis' in window) {
      window.speechSynthesis.speak(new SpeechSynthesisUtterance("Voice navigation is now enabled. Please say your destination."));
    }
  } else if (type === 'guide') {
    if (isAct && 'speechSynthesis' in window) {
      window.speechSynthesis.speak(new SpeechSynthesisUtterance("Welcome to Estadio Azteca. Wheelchair lifts are located at all nine main gates. sensory quiet zone is in the East concourse."));
    }
  }
}

async function triggerEmergencyAlert() {
  alert("CRITICAL ALARM: Emergency services dispatched. Medics and security units have been routed to concourse sector coordinates.");
  
  let incidents = globalState.get('ccIncidents') + 1;
  globalState.set('ccIncidents', incidents);
  
  const incEl = document.getElementById('cc-stat-incidents');
  if (incEl) incEl.textContent = `${incidents} Alerts`;
  
  const secEl = document.getElementById('cc-security-badge');
  if (secEl) secEl.textContent = `${incidents} Alerts`;
  
  await apiService.reportIncident('[CRITICAL] Egress SOS Button trigger in Accessibility Hub. Medical Unit 4 responding.');
  syncIncidentTimeline();
}

window.toggleAccessibility = toggleAccessibility;
window.triggerEmergencyAlert = triggerEmergencyAlert;

// ----------------------------------------------------
// 3D CAPABILITIES MOUSE TILT EFFECT
// ----------------------------------------------------
const cards = document.querySelectorAll('.capability-card');
cards.forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    
    const tiltX = (yc - y) / 10;
    const tiltY = (x - xc) / 10;
    
    card.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
    card.style.boxShadow = `0 14px 28px rgba(9, 13, 22, 0.08), 0 10px 10px rgba(9, 13, 22, 0.03)`;
  });
  
  card.addEventListener('mouseleave', () => {
    card.style.transform = `rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    card.style.boxShadow = '';
  });
});

// ----------------------------------------------------
// TIMELINE SIMULATED TICKER
// ----------------------------------------------------
let currentStepIdx = 1;
const progressEl = document.getElementById('timeline-progress');

setInterval(() => {
  const currNode = document.getElementById(`step-node-${currentStepIdx}`);
  if (currNode) currNode.classList.remove('active');
  
  currentStepIdx = (currentStepIdx % 4) + 1;
  
  const nextNode = document.getElementById(`step-node-${currentStepIdx}`);
  if (nextNode) nextNode.classList.add('active');

  let width = 0;
  if (currentStepIdx === 1) width = 0;
  else if (currentStepIdx === 2) width = 33;
  else if (currentStepIdx === 3) width = 66;
  else if (currentStepIdx === 4) width = 100;
  
  if (progressEl) progressEl.style.width = `${width}%`;
}, 6000);

// ----------------------------------------------------
// PHASE 2 AI FEATURE HANDLERS
// ----------------------------------------------------
async function analyzeIncident() {
  const input = document.getElementById('incident-input').value.trim();
  if (!input) {
    alert("Please enter a security log or situation to analyze.");
    return;
  }

  const formPanel = document.getElementById('incident-form-panel');
  const thinkingBox = document.getElementById('incident-thinking');
  const resultsPanel = document.getElementById('incident-results');

  formPanel.style.display = 'none';
  thinkingBox.style.display = 'flex';
  resultsPanel.style.display = 'none';

  try {
    // Request playbook summary from AI Service
    const data = await aiService.analyzeIncidentFeed(input);
    
    thinkingBox.style.display = 'none';
    resultsPanel.style.display = 'grid';

    document.getElementById('incident-risk-badge').textContent = `Risk Level: ${data.risk}`;
    document.getElementById('incident-risk-badge').className = `risk-badge-large ${data.riskClass}`;
    document.getElementById('incident-ai-summary').textContent = data.summary;
    document.getElementById('incident-ai-action').textContent = data.action;
    document.getElementById('incident-ai-volunteers').textContent = data.volunteers;
    document.getElementById('incident-ai-emergency').textContent = data.emergency;
  } catch (err) {
    formPanel.style.display = 'block';
    thinkingBox.style.display = 'none';
    toast.show("Incident analysis failed", "error");
  }
}

function resetIncidentConsole() {
  document.getElementById('incident-form-panel').style.display = 'block';
  document.getElementById('incident-thinking').style.display = 'none';
  document.getElementById('incident-results').style.display = 'none';
  document.getElementById('incident-input').value = '';
}

window.analyzeIncident = analyzeIncident;
window.resetIncidentConsole = resetIncidentConsole;

// Broadcast translater variables
let activeBroadcastLang = 'en';
let localBroadcastTranslations = {};

async function generateBroadcast() {
  const input = document.getElementById('broadcast-input').value.trim();
  if (!input) {
    alert("Please enter a short announcement bulletin text.");
    return;
  }

  const outputSection = document.getElementById('broadcast-output-section');
  outputSection.style.display = 'block';

  try {
    localBroadcastTranslations = await aiService.generateBroadcastTranslations(input);
    switchBroadcastLang('en');
  } catch (err) {
    toast.show("Failed to translate broadcast bulletin", "error");
  }
}

function switchBroadcastLang(lang) {
  activeBroadcastLang = lang;
  
  const tabBtns = document.querySelectorAll('.broadcast-tab-btn');
  tabBtns.forEach(btn => {
    btn.classList.remove('active');
    if (btn.id === `b-tab-${lang}`) btn.classList.add('active');
  });

  const previewBox = document.getElementById('broadcast-text-preview');
  previewBox.textContent = localBroadcastTranslations[lang] || '';
}

function copyBroadcast() {
  const text = localBroadcastTranslations[activeBroadcastLang] || '';
  navigator.clipboard.writeText(text).then(() => {
    toast.show("Announcement copied to clipboard!", "success");
  }).catch(() => {
    alert("Announcement content: " + text);
  });
}

async function broadcastToPA() {
  const text = localBroadcastTranslations[activeBroadcastLang] || '';
  toast.show(`Live PA broadcast synced: "${text.substring(0, 30)}..."`, "info");
  
  await apiService.reportIncident(`[PA BROADCAST]: "${text.substring(0, 50)}..." announcement broadcasted live.`);
  syncIncidentTimeline();
}

window.generateBroadcast = generateBroadcast;
window.switchBroadcastLang = switchBroadcastLang;
window.copyBroadcast = copyBroadcast;
window.broadcastToPA = broadcastToPA;

let crowdPredictDebounceTimer = null;

async function updateCrowdPredictions() {
  const occupancy = document.getElementById('slide-pred-occupancy').value;
  const timingVal = document.getElementById('slide-pred-timing').value;
  const weatherVal = document.getElementById('slide-pred-weather').value;

  document.getElementById('val-pred-occupancy').textContent = `${occupancy}%`;

  const TIMING_TEXTS = ["T-30m", "T-15m (Pre-match)", "Halftime", "T+75m (In-play)", "Egress (Post-match)"];
  document.getElementById('val-pred-timing').textContent = TIMING_TEXTS[timingVal];

  const WEATHER_TEXTS = ["Clear", "Rain Forecast", "Severe Storm Alert"];
  document.getElementById('val-pred-weather').textContent = WEATHER_TEXTS[weatherVal];

  if (crowdPredictDebounceTimer) {
    clearTimeout(crowdPredictDebounceTimer);
  }

  crowdPredictDebounceTimer = setTimeout(async () => {
    try {
      const response = await aiService.predictCrowdIssues(
        occupancy,
        TIMING_TEXTS[timingVal],
        WEATHER_TEXTS[weatherVal]
      );
      
      if (response && response.success) {
        document.getElementById('pred-confidence').textContent = `${response.confidence}%`;
        const container = document.getElementById('pred-alerts-box');
        if (container) {
          container.innerHTML = '';
          response.alerts.forEach(al => {
            const div = document.createElement('div');
            div.className = `sim-rec-item ${al.level === 'danger' ? 'danger' : (al.level === 'warn' ? 'warn' : '')}`;
            div.style.padding = '1rem';
            div.style.borderRadius = 'var(--radius-sm)';
            div.innerHTML = `<strong>${al.title}</strong> ${al.desc}`;
            container.appendChild(div);
          });
        }
      }
    } catch (e) {
      console.warn("Failing back to offline prediction model:", e.message);
    }
  }, 300);
}

// Bind sliders listeners
const slideOcc = document.getElementById('slide-pred-occupancy');
const slideTime = document.getElementById('slide-pred-timing');
const slideWeath = document.getElementById('slide-pred-weather');

if (slideOcc) slideOcc.addEventListener('input', updateCrowdPredictions);
if (slideTime) slideTime.addEventListener('input', updateCrowdPredictions);
if (slideWeath) slideWeath.addEventListener('input', updateCrowdPredictions);

// ----------------------------------------------------
// VOLUNTEER COPILOT DASHBOARD CONTROLLERS
// ----------------------------------------------------
let copilotCanvas, copilotCtx;
let selectedTaskIndex = 0;

const COPILOT_ROUTES = [
  { start: {x: 80, y: 50}, end: {x: 180, y: 70}, label: 'Gate A' },
  { start: {x: 60, y: 80}, end: {x: 120, y: 110}, label: 'Concourse B' },
  { start: {x: 100, y: 120}, end: {x: 150, y: 40}, label: 'South Stand' }
];

function initCopilotMap() {
  copilotCanvas = document.getElementById('copilot-map-canvas');
  if (!copilotCanvas) return;
  copilotCtx = copilotCanvas.getContext('2d');
  
  const dpr = window.devicePixelRatio || 1;
  const rect = copilotCanvas.getBoundingClientRect();
  if (rect.width === 0) {
    setTimeout(initCopilotMap, 50);
    return;
  }
  copilotCanvas.width = rect.width * dpr;
  copilotCanvas.height = rect.height * dpr;
  copilotCtx.scale(dpr, dpr);
  
  drawCopilotMap();
}

function drawCopilotMap() {
  if (!copilotCanvas || !copilotCtx) return;
  const w = copilotCanvas.width / (window.devicePixelRatio || 1);
  const h = copilotCanvas.height / (window.devicePixelRatio || 1);
  
  copilotCtx.clearRect(0, 0, w, h);
  
  const theme = document.documentElement.getAttribute('data-theme');
  copilotCtx.strokeStyle = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(9,13,22,0.06)';
  copilotCtx.lineWidth = 2;
  
  copilotCtx.beginPath();
  copilotCtx.arc(w/2, h/2, 45, 0, Math.PI*2);
  copilotCtx.arc(w/2, h/2, 70, 0, Math.PI*2);
  copilotCtx.stroke();
  
  const activeRoute = COPILOT_ROUTES[selectedTaskIndex];
  const routeColor = 'var(--accent-green)';
  
  copilotCtx.strokeStyle = routeColor;
  copilotCtx.lineWidth = 4;
  copilotCtx.shadowColor = routeColor;
  copilotCtx.shadowBlur = 6;
  
  copilotCtx.beginPath();
  copilotCtx.moveTo(w/2 + activeRoute.start.x - 120, h/2 + activeRoute.start.y - 80);
  copilotCtx.lineTo(w/2 + activeRoute.end.x - 120, h/2 + activeRoute.end.y - 80);
  copilotCtx.stroke();
  
  copilotCtx.shadowBlur = 0;
  
  copilotCtx.fillStyle = '#090D16';
  copilotCtx.strokeStyle = '#FFFFFF';
  copilotCtx.lineWidth = 2;
  
  copilotCtx.beginPath();
  copilotCtx.arc(w/2 + activeRoute.start.x - 120, h/2 + activeRoute.start.y - 80, 5, 0, Math.PI*2);
  copilotCtx.fill(); copilotCtx.stroke();
  
  copilotCtx.fillStyle = routeColor;
  copilotCtx.beginPath();
  copilotCtx.arc(w/2 + activeRoute.end.x - 120, h/2 + activeRoute.end.y - 80, 6, 0, Math.PI*2);
  copilotCtx.fill(); copilotCtx.stroke();
}

function selectVolunteerTask(idx, targetLabel) {
  selectedTaskIndex = idx;
  
  const cards = document.querySelectorAll('.copilot-task-card');
  cards.forEach(card => card.classList.remove('active'));
  
  const activeCard = document.getElementById(`task-card-${idx}`);
  if (activeCard) activeCard.classList.add('active');

  document.getElementById('copilot-active-task-target').textContent = `TARGET COORDINATES • ${targetLabel.toUpperCase()}`;
  
  drawCopilotMap();
}

function acceptVolunteerTask() {
  const activeRoute = COPILOT_ROUTES[selectedTaskIndex];
  toast.show(`Assignment Accepted: Navigating to ${activeRoute.label}. ETA: 3 min.`, "success");
}

function reportVolunteerIssue() {
  const issue = prompt("Enter the issue description to send to operations Command Center:");
  if (issue) {
    apiService.reportIncident(`[STAFF REPORT]: "${issue}" reported by Steward Unit 12.`);
    syncIncidentTimeline();
    toast.show("Issue reported and logged successfully.", "success");
  }
}

function sendCopilotPrompt(text) {
  const input = document.getElementById('copilot-chat-input');
  if (input) {
    input.value = text;
    sendCopilotMessage();
  }
}

function sendCopilotMessage() {
  const input = document.getElementById('copilot-chat-input');
  if (!input) return;
  const query = input.value.trim();
  if (!query) return;

  input.value = '';
  const feed = document.getElementById('copilot-chat-feed');
  if (!feed) return;

  const userDiv = document.createElement('div');
  userDiv.style.margin = '0.5rem 0';
  userDiv.innerHTML = `<strong>You:</strong> ${query}`;
  feed.appendChild(userDiv);
  feed.scrollTop = feed.scrollHeight;

  setTimeout(() => {
    let reply = "Steward coordinates are synced with Command Center. Please standby for routing.";
    const lower = query.toLowerCase();

    if (lower.includes('go') || lower.includes('where')) {
      reply = "Please navigate to East Gate A to support high entry turnstile flow. Check map route.";
    } else if (lower.includes('gate') || lower.includes('support')) {
      reply = "East Gate A queue is saturated. West Gate D is operating at 22% capacity. Direct fans there.";
    } else if (lower.includes('medical') || lower.includes('first aid') || lower.includes('team')) {
      reply = "Nearest Medical Unit is stationed at Concourse B locker 3. Escort dispatched fan.";
    }

    const replyDiv = document.createElement('div');
    replyDiv.style.background = 'var(--bg-card)';
    replyDiv.style.padding = '0.6rem 0.8rem';
    replyDiv.style.borderRadius = 'var(--radius-sm)';
    replyDiv.style.border = '1px solid var(--border-color)';
    replyDiv.style.margin = '0.5rem 0';
    replyDiv.innerHTML = `<strong>AI Copilot:</strong> ${reply}`;
    feed.appendChild(replyDiv);
    feed.scrollTop = feed.scrollHeight;
  }, 1000);
}

window.selectVolunteerTask = selectVolunteerTask;
window.acceptVolunteerTask = acceptVolunteerTask;
window.reportVolunteerIssue = reportVolunteerIssue;
window.sendCopilotPrompt = sendCopilotPrompt;
window.sendCopilotMessage = sendCopilotMessage;

// ----------------------------------------------------
// 3D / DEPTH EFFECTS (THREE.JS & CARD TILT PERSPECTIVE)
// ----------------------------------------------------
function initThreeJSHero() {
  const container = document.getElementById('hero-3d-overlay');
  if (!container || !window.THREE) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(12, 12, 12);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambientLight);

  // Build the 3D Blueprint Stadium Group (Matching the line-drawing first photo)
  const stadiumGroup = new THREE.Group();

  // 1. Central field
  const pitchGeom = new THREE.PlaneGeometry(5, 7.5);
  const pitchMat = new THREE.MeshBasicMaterial({ color: 0x05210b, transparent: true, opacity: 0.25, side: THREE.DoubleSide });
  const pitch = new THREE.Mesh(pitchGeom, pitchMat);
  pitch.rotateX(-Math.PI / 2);
  stadiumGroup.add(pitch);

  const pitchPoints = [];
  pitchPoints.push(new THREE.Vector3(-2.5, 0.01, -3.75));
  pitchPoints.push(new THREE.Vector3(2.5, 0.01, -3.75));
  pitchPoints.push(new THREE.Vector3(2.5, 0.01, 3.75));
  pitchPoints.push(new THREE.Vector3(-2.5, 0.01, 3.75));
  pitchPoints.push(new THREE.Vector3(-2.5, 0.01, -3.75));
  pitchPoints.push(new THREE.Vector3(-2.5, 0.01, 0));
  pitchPoints.push(new THREE.Vector3(2.5, 0.01, 0));
  
  const pitchLinesGeom = new THREE.BufferGeometry().setFromPoints(pitchPoints);
  const pitchLinesMat = new THREE.LineBasicMaterial({ color: 0x00FF66, transparent: true, opacity: 0.75 });
  const pitchLines = new THREE.Line(pitchLinesGeom, pitchLinesMat);
  stadiumGroup.add(pitchLines);

  // Center circle on pitch
  const centerCircleCurve = new THREE.EllipseCurve(0, 0, 1.2, 1.2, 0, 2 * Math.PI, false, 0);
  const ccPoints = centerCircleCurve.getPoints(32);
  const ccGeom = new THREE.BufferGeometry().setFromPoints(ccPoints.map(p => new THREE.Vector3(p.x, 0.01, p.y)));
  const ccLine = new THREE.Line(ccGeom, pitchLinesMat);
  stadiumGroup.add(ccLine);

  // 2. Concentric oval seating rings (seating bowl layout)
  const numTiers = 9;
  for (let t = 0; t < numTiers; t++) {
    const radiusX = 4.8 + t * 0.75;
    const radiusZ = 6.8 + t * 0.95;
    const heightY = t * 0.38;

    const curve = new THREE.EllipseCurve(
      0, 0,
      radiusX, radiusZ,
      0, 2 * Math.PI,
      false,
      0
    );

    const ringPoints = curve.getPoints(64);
    const ringGeom = new THREE.BufferGeometry().setFromPoints(ringPoints.map(p => new THREE.Vector3(p.x, heightY, p.y)));
    const ringMat = new THREE.LineBasicMaterial({
      color: 0x00FF66,
      transparent: true,
      opacity: Math.max(0.2, 0.75 - (t * 0.06))
    });
    const ringLine = new THREE.Line(ringGeom, ringMat);
    stadiumGroup.add(ringLine);
  }

  // 3. Sector/Radial dividers
  const numDividers = 16;
  const innerR = 4;
  const outerRX = 4.8 + (numTiers - 1) * 0.75;
  const outerRZ = 6.8 + (numTiers - 1) * 0.95;
  const maxHeight = (numTiers - 1) * 0.38;

  const divGeom = new THREE.BufferGeometry();
  const divPoints = [];

  for (let d = 0; d < numDividers; d++) {
    const angle = (d / numDividers) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const xStart = cos * innerR;
    const zStart = sin * (innerR * 1.4);
    const xEnd = cos * outerRX;
    const zEnd = sin * outerRZ;

    divPoints.push(new THREE.Vector3(xStart, 0, zStart));
    divPoints.push(new THREE.Vector3(xEnd, maxHeight, zEnd));
  }
  divGeom.setFromPoints(divPoints);
  const divMat = new THREE.LineBasicMaterial({ color: 0x00FF66, transparent: true, opacity: 0.35 });
  const divLines = new THREE.LineSegments(divGeom, divMat);
  stadiumGroup.add(divLines);

  scene.add(stadiumGroup);

  // Rotation and mouse controls
  let targetX = 0;
  let targetY = 0;

  window.addEventListener('mousemove', (e) => {
    targetX = (e.clientX / window.innerWidth) * 2 - 1;
    targetY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  const animate = () => {
    requestAnimationFrame(animate);

    if (!prefersReducedMotion) {
      stadiumGroup.rotation.y += 0.0015;
      
      // Mouse parallax tilt
      stadiumGroup.rotation.z += (targetX * 0.12 - stadiumGroup.rotation.z) * 0.06;
      stadiumGroup.rotation.x += (targetY * 0.08 - stadiumGroup.rotation.x) * 0.06;
    }

    renderer.render(scene, camera);
  };

  animate();

  window.addEventListener('resize', () => {
    if (!container.clientWidth) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  // Scroll parallax fade out for Pelé background image
  window.addEventListener('scroll', () => {
    const bgPele = document.getElementById('hero-bg-pele');
    const overlayPele = document.getElementById('hero-bg-overlay-pele');
    if (bgPele && overlayPele) {
      const opacity = Math.max(0, 1 - window.scrollY / 500);
      bgPele.style.opacity = opacity;
      overlayPele.style.opacity = opacity;
    }
  });
}

function initCardTiltEffects() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const tiltCards = document.querySelectorAll('.stat-item, .glass-card, .sim-cc-card');

  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((centerY - y) / centerY) * 4;
      const rotateY = ((x - centerX) / centerX) * 4;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
      card.style.transition = 'none';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
      card.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    });
  });
}

// ----------------------------------------------------
// FLAGSHIP 3D STADIUM DIGITAL TWIN (THE WOW MOMENT)
// ----------------------------------------------------
function initFlagship3DDigitalTwin() {
  const container = document.getElementById('stadium-3d-twin-viewport');
  if (!container || !window.THREE) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(16, 16, 16);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(10, 20, 10);
  scene.add(dirLight);

  const pointLight = new THREE.PointLight(0x00FF66, 1.5, 50);
  pointLight.position.set(0, 4, 0);
  scene.add(pointLight);

  // Orbit controls
  let controls = null;
  if (window.THREE.OrbitControls) {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 8;
    controls.maxDistance = 35;
  }

  // Soccer field base
  const pitchGeom = new THREE.BoxGeometry(5.5, 0.1, 8);
  const pitchMat = new THREE.MeshBasicMaterial({ color: 0x002c11 });
  const pitchMesh = new THREE.Mesh(pitchGeom, pitchMat);
  pitchMesh.position.y = -0.05;
  scene.add(pitchMesh);

  // Outline border
  const pitchLinesGeom = new THREE.BufferGeometry();
  const points = [];
  points.push(new THREE.Vector3(-2.75, 0.01, -4));
  points.push(new THREE.Vector3(2.75, 0.01, -4));
  points.push(new THREE.Vector3(2.75, 0.01, 4));
  points.push(new THREE.Vector3(-2.75, 0.01, 4));
  points.push(new THREE.Vector3(-2.75, 0.01, -4));
  points.push(new THREE.Vector3(-2.75, 0.01, 0));
  points.push(new THREE.Vector3(2.75, 0.01, 0));
  pitchLinesGeom.setFromPoints(points);
  const pitchLinesMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
  const pitchLines = new THREE.Line(pitchLinesGeom, pitchLinesMat);
  scene.add(pitchLines);

  const sectorKeys = ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'];
  const sectorNames = [
    'EAST STAND', 'SOUTH-EAST STAND', 'SOUTH STAND', 'SOUTH-WEST STAND', 
    'WEST STAND', 'NORTH-WEST STAND', 'NORTH STAND', 'NORTH-EAST STAND'
  ];
  const sectorMeshes = [];

  const updateSectorColor = (mesh, density) => {
    let color = 0x4ADE80;
    if (density > 85) color = 0xEF4444;
    else if (density > 65) color = 0xF59E0B;
    mesh.material.color.setHex(color);
    mesh.material.emissive.setHex(color);
  };

  const innerR = 6.8;
  const outerR = 8.8;
  const depthVal = 2.5;

  for (let s = 0; s < 8; s++) {
    const startAngle = s * Math.PI / 4 - Math.PI / 8;
    const lengthAngle = Math.PI / 4;
    
    const shape = new THREE.Shape();
    const x1 = Math.cos(startAngle) * innerR;
    const z1 = Math.sin(startAngle) * innerR;
    shape.moveTo(x1, z1);
    shape.absarc(0, 0, outerR, startAngle, startAngle + lengthAngle, false);
    shape.absarc(0, 0, innerR, startAngle + lengthAngle, startAngle, true);

    const extrudeSettings = {
      steps: 1,
      depth: depthVal,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.08,
      bevelSegments: 2
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.rotateX(-Math.PI / 2);

    const mat = new THREE.MeshStandardMaterial({
      color: 0x4ADE80,
      roughness: 0.25,
      metalness: 0.7,
      transparent: true,
      opacity: 0.7,
      emissive: 0x4ADE80,
      emissiveIntensity: 0.1
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.userData = { 
      sectorKey: sectorKeys[s],
      sectorName: sectorNames[s]
    };
    scene.add(mesh);
    sectorMeshes.push(mesh);

    const edges = new THREE.EdgesGeometry(geom);
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });
    const line = new THREE.LineSegments(edges, lineMat);
    mesh.add(line);
  }

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let hoveredMesh = null;

  const updateHUD = (sectorKey, sectorName) => {
    const venueKey = globalState.get('activeVenueKey') || 'estadio-azteca';
    const venueData = VENUE_TELEMETRY_MOCK[venueKey].data[sectorKey];
    if (!venueData) return;

    const titleEl = document.getElementById('hud-sector-title');
    const occupancyEl = document.getElementById('hud-occupancy-val');
    const waitEl = document.getElementById('hud-wait-val');
    const gateEl = document.getElementById('hud-gate-val');
    const badgeEl = document.getElementById('hud-density-badge');
    const mitigationEl = document.getElementById('hud-mitigation-val');
    const recEl = document.getElementById('hud-recommendation-val');

    if (titleEl) titleEl.textContent = sectorName;
    if (occupancyEl) occupancyEl.textContent = `${venueData.density}%`;
    if (waitEl) waitEl.textContent = venueData.dwell;
    if (gateEl) gateEl.textContent = `Gate ${sectorKey.substring(0, 2).toUpperCase()}`;

    let statusText = 'NOMINAL';
    let badgeBg = 'rgba(74, 222, 128, 0.15)';
    let badgeColor = '#4ADE80';
    let mitigation = 'Nominal flow';
    let recommendation = 'All turnstile flows in this stand are normal. Pre-match egress is performing within safe density SLAs. No action required.';

    if (venueData.density > 85) {
      statusText = 'CRITICAL';
      badgeBg = 'rgba(239, 68, 68, 0.15)';
      badgeColor = '#EF4444';
      mitigation = 'AI Signage Engaged';
      recommendation = `[CRITICAL WARNING] Sector queue delay exceeding turnstile limits. Reroute SOP firing. Adjusting digital signage paths to redirect spectators to Gate C.`;
    } else if (venueData.density > 65) {
      statusText = 'WARNING';
      badgeBg = 'rgba(245, 158, 11, 0.15)';
      badgeColor = '#F59E0B';
      mitigation = 'Monitoring lanes';
      recommendation = `[WARNING] Density building up near stand exit portals. Suggesting alternative egress routes on user companion app. Standard steward protocols alert.`;
    }

    if (badgeEl) {
      badgeEl.textContent = statusText;
      badgeEl.style.background = badgeBg;
      badgeEl.style.color = badgeColor;
      badgeEl.style.borderColor = badgeColor;
    }

    if (mitigationEl) mitigationEl.textContent = mitigation;
    if (recEl) recEl.textContent = recommendation;
  };

  renderer.domElement.addEventListener('mousemove', (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;
  });

  renderer.domElement.addEventListener('click', () => {
    if (hoveredMesh) {
      const key = hoveredMesh.userData.sectorKey;
      globalState.set('selectedBlock', key);
      updateSimulatorPanel();
      toast.show(`Digital Twin focused: ${hoveredMesh.userData.sectorName}`, "info");
    }
  });

  const animate = () => {
    requestAnimationFrame(animate);

    if (controls) controls.update();

    const venueKey = globalState.get('activeVenueKey') || 'estadio-azteca';
    for (let s = 0; s < 8; s++) {
      const mesh = sectorMeshes[s];
      const data = VENUE_TELEMETRY_MOCK[venueKey].data[mesh.userData.sectorKey];
      if (data) {
        updateSectorColor(mesh, data.density);

        if (data.density > 85 && !prefersReducedMotion) {
          const scale = 1.0 + Math.sin(Date.now() * 0.006) * 0.02;
          mesh.scale.set(1, scale, 1);
        } else {
          mesh.scale.set(1, 1, 1);
        }
      }
    }

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(sectorMeshes);

    if (intersects.length > 0) {
      const first = intersects[0].object;
      if (hoveredMesh !== first) {
        if (hoveredMesh) {
          hoveredMesh.material.opacity = 0.7;
          hoveredMesh.position.y = 0;
        }
        hoveredMesh = first;
        hoveredMesh.material.opacity = 0.95;
        if (!prefersReducedMotion) {
          hoveredMesh.position.y = 0.4;
        }
        updateHUD(hoveredMesh.userData.sectorKey, hoveredMesh.userData.sectorName);
      }
    } else {
      if (hoveredMesh) {
        hoveredMesh.material.opacity = 0.7;
        hoveredMesh.position.y = 0;
        hoveredMesh = null;
      }
    }

    renderer.render(scene, camera);
  };

  animate();

  const resizeObserver = new ResizeObserver(() => {
    if (!container.clientWidth) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
  resizeObserver.observe(container);
}

// ----------------------------------------------------
// INITIALIZER
// ----------------------------------------------------
const initAll = () => {
  initRadar();
  drawRadar();
  
  initQueueCanvas();
  drawQueueFlow();

  initCircularCanvas();
  drawCircularStadium();
  updateSimulatorPanel();
  
  initNavCanvas();
  drawNavStadium();

  // Initialize all live weather, interactive maps, geolocation, football, news, translation & speech integrations
  apiIntegration.init();

  // Initialize ThreeJS particle and card tilts
  initThreeJSHero();
  initCardTiltEffects();
  initFlagship3DDigitalTwin();
  initScrollAnimations();

  // Handle fixed header scrolled background overlay
  const headerEl = document.querySelector('header');
  if (headerEl) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        headerEl.classList.add('scrolled');
      } else {
        headerEl.classList.remove('scrolled');
      }
    });
    if (window.scrollY > 20) headerEl.classList.add('scrolled');
  }
};

function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, { threshold: 0.05 });

  document.querySelectorAll('.scroll-fade-in').forEach(el => {
    observer.observe(el);
  });
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initAll();
} else {
  window.addEventListener('DOMContentLoaded', initAll);
}

window.onresize = () => {
  initRadar();
  initQueueCanvas();
  initCircularCanvas();
  initNavCanvas();
  initCopilotMap();
};
