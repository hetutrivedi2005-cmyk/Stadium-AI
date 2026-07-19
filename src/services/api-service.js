import { apiClient } from '../utils/api-client.js';
import { API_ENDPOINTS, CONFIG } from '../config.js';
import { globalState } from '../state/global-state.js';

// Global local telemetry state mockups
const VENUE_TELEMETRY_MOCK = {
  'estadio-azteca': {
    name: 'Estadio Azteca',
    label: 'VENUE · ESTADIO AZTECA / SECTION VIEW',
    data: {
      'north': { name: 'NORTH STAND • SEC 101', capacity: '18450', density: 76, dwell: '4:12', playbook: 'Gate-D-Bypass', severity: 'medium' },
      'north-east': { name: 'NE CONCOURSE • SEC 120', capacity: '8120', density: 42, dwell: '2:15', playbook: 'Passive-Monitor', severity: 'low' },
      'east': { name: 'EAST STAND • SEC 204', capacity: '14110', density: 64, dwell: '3:10', playbook: 'Passive-Monitor', severity: 'low' },
      'south-east': { name: 'SE CONCOURSE • SEC 220', capacity: '9840', density: 91, dwell: '6:50', playbook: 'Reroute-Terminal-3', severity: 'high' },
      'south': { name: 'SOUTH STAND • SEC 301', capacity: '22400', density: 85, dwell: '5:02', playbook: 'Egress-Fast-Track', severity: 'high' },
      'south-west': { name: 'SW CONCOURSE • SEC 320', capacity: '7450', density: 31, dwell: '1:50', playbook: 'Passive-Monitor', severity: 'low' },
      'west': { name: 'WEST STAND • SEC 401', capacity: '12980', density: 55, dwell: '2:40', playbook: 'Passive-Monitor', severity: 'low' },
      'north-west': { name: 'NW CONCOURSE • SEC 420', capacity: '11200', density: 89, dwell: '5:45', playbook: 'Signage-Redirect-W', severity: 'high' }
    }
  },
  'sofi-stadium': {
    name: 'SoFi Stadium',
    label: 'VENUE · SOFI STADIUM / SECTION VIEW',
    data: {
      'north': { name: 'NORTH PEAK • SEC 102', capacity: '15200', density: 52, dwell: '2:45', playbook: 'Passive-Monitor', severity: 'low' },
      'north-east': { name: 'AMBER DECK • SEC 108', capacity: '9400', density: 88, dwell: '5:10', playbook: 'Access-Deck-Flow', severity: 'high' },
      'east': { name: 'EAST LEVEL • SEC 201', capacity: '17800', density: 72, dwell: '3:50', playbook: 'Buffer-Control', severity: 'medium' },
      'south-east': { name: 'SOUTHEAST DECK • SEC 215', capacity: '6900', density: 45, dwell: '2:12', playbook: 'Passive-Monitor', severity: 'low' },
      'south': { name: 'SOUTH PLAZA • SEC 302', capacity: '19300', density: 60, dwell: '3:05', playbook: 'Passive-Monitor', severity: 'low' },
      'south-west': { name: 'SOUTHWEST PEAK • SEC 318', capacity: '8200', density: 78, dwell: '4:20', playbook: 'Gate-B-Bypass', severity: 'medium' },
      'west': { name: 'WEST LEVEL • SEC 402', capacity: '16500', density: 94, dwell: '7:15', playbook: 'Plaza-Egress-SOP', severity: 'high' },
      'north-west': { name: 'NORTHWEST DECK • SEC 412', capacity: '10100', density: 33, dwell: '1:58', playbook: 'Passive-Monitor', severity: 'low' }
    }
  },
  'munich-bay': {
    name: 'Munich Bay',
    label: 'VENUE · MUNICH BAY / SECTION VIEW',
    data: {
      'north': { name: 'NORDTRIBÜNE • SEC 110', capacity: '16800', density: 82, dwell: '4:40', playbook: 'Nord-Exit-Reroute', severity: 'high' },
      'north-east': { name: 'OST-NORD ECKE • SEC 115', capacity: '7900', density: 50, dwell: '2:30', playbook: 'Passive-Monitor', severity: 'low' },
      'east': { name: 'GEGENTRIBÜNE • SEC 210', capacity: '15400', density: 61, dwell: '3:05', playbook: 'Passive-Monitor', severity: 'low' },
      'south-east': { name: 'OST-SÜD ECKE • SEC 215', capacity: '8200', density: 74, dwell: '4:02', playbook: 'Terminal-East-Sync', severity: 'medium' },
      'south': { name: 'SÜDTRIBÜNE • SEC 310', capacity: '20100', density: 92, dwell: '6:35', playbook: 'Süd-Egress-SOP', severity: 'high' },
      'south-west': { name: 'WEST-SÜD ECKE • SEC 315', capacity: '7100', density: 40, dwell: '2:05', playbook: 'Passive-Monitor', severity: 'low' },
      'west': { name: 'HAUPTTRIBÜNE • SEC 410', capacity: '14300', density: 58, dwell: '2:55', playbook: 'Passive-Monitor', severity: 'low' },
      'north-west': { name: 'WEST-NORD ECKE • SEC 415', capacity: '9000', density: 67, dwell: '3:30', playbook: 'Buffer-West-Open', severity: 'medium' }
    }
  },
  'metlife-stadium': {
    name: 'MetLife Stadium',
    label: 'VENUE · METLIFE STADIUM / SECTION VIEW',
    data: {
      'north': { name: 'NORTH TIER • SEC 111', capacity: '19100', density: 48, dwell: '2:25', playbook: 'Passive-Monitor', severity: 'low' },
      'north-east': { name: 'MEZZANINE NE • SEC 122', capacity: '8500', density: 66, dwell: '3:40', playbook: 'Passive-Monitor', severity: 'low' },
      'east': { name: 'EAST UPPER TIER • SEC 212', capacity: '16200', density: 87, dwell: '5:15', playbook: 'East-Gate-Bypass', severity: 'high' },
      'south-east': { name: 'MEZZANINE SE • SEC 222', capacity: '9300', density: 79, dwell: '4:30', playbook: 'SOP-Route-Train', severity: 'medium' },
      'south': { name: 'SOUTH PLAZA • SEC 311', capacity: '21800', density: 54, dwell: '2:50', playbook: 'Passive-Monitor', severity: 'low' },
      'south-west': { name: 'MEZZANINE SW • SEC 322', capacity: '7800', density: 38, dwell: '1:55', playbook: 'Passive-Monitor', severity: 'low' },
      'west': { name: 'WEST UPPER TIER • SEC 412', capacity: '15900', density: 73, dwell: '4:10', playbook: 'West-Gate-Relief', severity: 'medium' },
      'north-west': { name: 'MEZZANINE NW • SEC 422', capacity: '10500', density: 90, dwell: '6:12', playbook: 'NW-Exit-Reroute', severity: 'high' }
    }
  }
};

class ApiService {
  /**
   * Retrieves static configurations and state metrics for active sectors
   */
  async getSectorsTelemetry(venueKey) {
    if (CONFIG.MOCK_MODE) {
      await apiClient.get(API_ENDPOINTS.STADIUM.SECTORS);
      return VENUE_TELEMETRY_MOCK[venueKey] || VENUE_TELEMETRY_MOCK['estadio-azteca'];
    } else {
      return await apiClient.get(`${API_ENDPOINTS.STADIUM.SECTORS}?venue=${venueKey}`);
    }
  }

  /**
   * Toggles turnstile mitigations and adjusts density counts
   */
  async updateMitigationMode(venueKey, sectorKey, isEngaged) {
    if (CONFIG.MOCK_MODE) {
      await apiClient.put(API_ENDPOINTS.STADIUM.MITIGATION, { venueKey, sectorKey, isEngaged });
      
      const sector = VENUE_TELEMETRY_MOCK[venueKey].data[sectorKey];
      if (isEngaged) {
        if (sector.density > 70) sector.density -= 12;
      } else {
        sector.density = Math.min(100, sector.density + 8);
      }
      return sector;
    } else {
      return await apiClient.put(API_ENDPOINTS.STADIUM.MITIGATION, { venueKey, sectorKey, isEngaged });
    }
  }

  /**
   * Submits a live security incident feed update
   */
  async reportIncident(message) {
    if (CONFIG.MOCK_MODE) {
      await apiClient.post(API_ENDPOINTS.STADIUM.INCIDENTS, { message });
      
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const isAlert = message.includes('[ALERT]') || message.includes('[WARNING]') || message.includes('[CRITICAL]');
      
      const newIncident = { time: timeStr, msg: message, isAlert };
      const currentList = globalState.get('incidentsList');
      globalState.set('incidentsList', [newIncident, ...currentList.slice(0, 4)]);
      return newIncident;
    } else {
      return await apiClient.post(API_ENDPOINTS.STADIUM.INCIDENTS, { message });
    }
  }

  /**
   * Retrieves transportation links statuses
   */
  async getTransitStatus() {
    await apiClient.get(API_ENDPOINTS.STADIUM.TRANSIT);
    return {
      metro: { status: 'On Time', wait: '2m', frequency: '180%' },
      shuttle: { status: '4m Delay', wait: '6m' },
      parking: { occupancy: 72, zoneA: 94, zoneD: 62 }
    };
  }

  /**
   * Fetches lists of active task queues for volunteers
   */
  async getVolunteerTasks() {
    await apiClient.get(API_ENDPOINTS.STADIUM.TASKS);
    return [
      { id: 0, title: "Crowd Control support at East Gate A", priority: 'HIGH', eta: '3 min', distance: '150m', target: 'Gate A Entrance', advice: "Deploy standard Gate-A overflow playbooks." },
      { id: 1, title: "First Aid escort near Concourse B", priority: 'HIGH', eta: '2 min', distance: '90m', target: 'Concourse B Concession 12', advice: "Grab hydration kit from Concourse locker 3." },
      { id: 2, title: "Accessibility lift assist at South Stand", priority: 'MEDIUM', eta: '5 min', distance: '220m', target: 'Lift 4 south platform', advice: "Lift 4 requires manual bypass key. Check in at Desk C." }
    ];
  }
}

export const apiService = new ApiService();
export { VENUE_TELEMETRY_MOCK };
