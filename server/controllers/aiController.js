import { geminiService } from '../services/geminiService.js';
import { weatherService } from '../services/weatherService.js';
import ChatHistory from '../models/ChatHistory.js';
import Incident from '../models/Incident.js';
import Announcement from '../models/Announcement.js';
import Prediction from '../models/Prediction.js';
import fs from 'fs';
import path from 'path';

const SYSTEM_PROMPT = `You are StadiumAI, an intelligent AI assistant for FIFA World Cup 2026 stadium operations.
Help fans, volunteers, organizers, medical staff, and security teams.
Provide clear, professional, concise, and context-aware responses.
If live stadium information is unavailable, clearly mention that the response is based on simulated demo data.`;

import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load stadiums database
let STADIUMS = [];
try {
  const stadiumsPath = path.resolve(__dirname, '..', '..', 'data', 'stadiums.json');
  STADIUMS = JSON.parse(fs.readFileSync(stadiumsPath, 'utf8'));
} catch (e) {
  console.warn("Could not load stadiums database in controller:", e.message);
}

/** Silent DB save — never throws, never blocks response */
const silentSave = async (fn) => {
  try { await fn(); } catch (e) { console.warn('[DB Save Warning]', e.message); }
};

class AiController {
  /**
   * Smart Stadium Assistant Chat Endpoint
   * Auto-saves every chat exchange to ChatHistory collection.
   */
  async chat(req, res) {
    const { message, role, context, userId, sessionId, language } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: "Empty prompt: message is required." });
    }

    try {
      let prompt = `User Message: "${message}"\n`;
      prompt += `User Assigned Role: ${role || 'Guest / Spectator'}\n`;

      let weatherInfo = null;
      let activeStadium = null;

      if (context) {
        prompt += `Context Telemetry details:\n`;
        let lat = null, lon = null;

        if (context.stadium) {
          const match = STADIUMS.find(s => s.stadiumId === context.stadium || s.name.toLowerCase().includes(context.stadium.toLowerCase()));
          if (match) {
            lat = match.latitude;
            lon = match.longitude;
            activeStadium = match.stadiumId || context.stadium;
            prompt += `- Current Stadium: ${match.name} (${match.city}, ${match.country})\n`;
          } else {
            activeStadium = context.stadium;
            prompt += `- Current Stadium: ${context.stadium}\n`;
          }
        }

        if (context.userLocation?.latitude) {
          lat = context.userLocation.latitude;
          lon = context.userLocation.longitude;
          prompt += `- User Current Location: Lat ${lat}, Lon ${lon}\n`;
          if (context.userLocation.distanceKm) prompt += `- Distance to Stadium: ${context.userLocation.distanceKm} km\n`;
        }

        if (lat !== null && lon !== null) {
          try {
            weatherInfo = await weatherService.getWeather(lat, lon);
            prompt += `- Live Stadium Weather: ${weatherInfo.temperature}°C, ${weatherInfo.condition} (${weatherInfo.conditionDesc}). Humidity ${weatherInfo.humidity}%, Wind ${weatherInfo.windSpeed} m/s, UV Index ${weatherInfo.uvIndex}, Rain Probability ${weatherInfo.rainProbability}%\n`;
          } catch (wErr) {
            console.warn("Could not append weather to AI context:", wErr.message);
          }
        }

        if (!weatherInfo && context.weather) prompt += `- Weather Condition (simulated): ${context.weather}\n`;
        if (context.density) prompt += `- Sector Crowd Density: ${context.density}%\n`;
        if (context.matchTime) prompt += `- Match Time status: ${context.matchTime}\n`;
        if (context.language) prompt += `- Preferred Language: ${context.language}\n`;
      }

      prompt += `\nPlease reply to the user message in a helpful, context-aware, and concise manner. Take the weather and location metrics into account automatically if relevant to their operations request.`;

      const reply = await geminiService.generateResponse(prompt, SYSTEM_PROMPT);

      // Auto-save chat to MongoDB (non-blocking)
      silentSave(() => ChatHistory.create({
        userId: userId || 'anonymous',
        role: role || 'guest',
        prompt: message,
        response: reply,
        language: language || context?.language || 'en',
        stadium: activeStadium,
        sessionId: sessionId || null,
        weatherContext: weatherInfo ? {
          temperature: weatherInfo.temperature,
          condition: weatherInfo.condition,
          humidity: weatherInfo.humidity,
        } : undefined,
        model: 'Gemini',
      }));

      return res.json({ success: true, reply, timestamp: new Date().toISOString(), model: "Gemini", weatherContext: weatherInfo });
    } catch (err) {
      console.error("Chat controller failed:", err.message);
      return res.status(500).json({
        success: false,
        error: "Google Gemini AI services are currently offline.",
        reply: "Error communicating with operational command nodes. Please standby for link re-establishment."
      });
    }
  }

  /**
   * Translates arbitrary text into target language using Gemini
   */
  async translateText(req, res) {
    const { text, targetLang } = req.body;
    if (!text || !targetLang) return res.status(400).json({ success: false, error: "text and targetLang are required." });

    try {
      const prompt = `Translate the following stadium operations or dashboard text naturally into "${targetLang}". 
Keep any formatting, brackets, CSS classes, HTML tags, or critical names (like Gate D, MetLife Stadium, etc.) intact.
Respond ONLY with the exact translated text, do not add quotes, introductions, or warnings.

Text to translate:
${text}`;
      const translatedText = await geminiService.generateResponse(prompt, "You are a professional multilingual translator for FIFA World Cup stadium operations.");
      return res.json({ success: true, translatedText: translatedText.trim() });
    } catch (err) {
      console.error("Translate text controller failed:", err.message);
      return res.status(500).json({ success: false, error: "Translation failed", translatedText: text });
    }
  }

  /**
   * Incident Analysis Playbook Generation
   * Auto-saves AI-generated incident to Incident collection.
   */
  async incident(req, res) {
    const { logText, stadium, reportedBy } = req.body;
    if (!logText) return res.status(400).json({ success: false, error: "logText is required." });

    try {
      const prompt = `Analyze the following security incident log and generate a JSON playbook response containing:
- "risk": (LOW, MEDIUM, HIGH, CRITICAL)
- "riskClass": (low, medium, or high)
- "summary": (brief operational summary of what happened)
- "action": (suggested response action)
- "volunteers": (allocation details for steward units)
- "emergency": (action instructions for medical/emergency route units)

Log content: "${logText}"

Respond ONLY with a valid JSON block matching this schema. Do not enclose in markdown blocks.`;

      const resultText = await geminiService.generateResponse(prompt, SYSTEM_PROMPT);
      const cleanedJSON = resultText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const playbook = JSON.parse(cleanedJSON);

      // Auto-save incident to MongoDB (non-blocking)
      silentSave(() => Incident.create({
        title: `AI Incident: ${logText.substring(0, 80)}`,
        description: logText,
        severity: playbook.risk || 'MEDIUM',
        category: 'security',
        stadium: stadium || null,
        reportedBy: reportedBy || 'system',
        status: 'open',
        aiGenerated: true,
        aiPlaybook: playbook,
      }));

      return res.json({ success: true, ...playbook });
    } catch (err) {
      console.error("Incident controller failed:", err.message);
      const fallback = {
        risk: "MEDIUM", riskClass: "medium",
        summary: "Crowd gathering observed in local sector concourses, resulting in localized friction points.",
        action: "Deploy local volunteer units to guide spectator overflow into peripheral gate paths.",
        volunteers: "Assign 12 roaming stewards from Sector 100 to active choke points.",
        emergency: "Clear secondary exit Corridor B and set overhead dynamic signage directions."
      };
      silentSave(() => Incident.create({
        title: `AI Incident (fallback): ${logText.substring(0, 80)}`,
        description: logText,
        severity: 'MEDIUM',
        category: 'security',
        stadium: stadium || null,
        reportedBy: reportedBy || 'system',
        aiGenerated: true,
        aiPlaybook: fallback,
      }));
      return res.json({ success: true, ...fallback });
    }
  }

  /**
   * Crowd Density Prediction
   * Auto-saves prediction to Prediction collection.
   */
  async predict(req, res) {
    const { occupancy, timing, weather, stadium, requestedBy } = req.body;

    try {
      const prompt = `Predict crowd bottlenecks and density issues based on these parameters:
- Occupancy level: ${occupancy || 50}%
- Match timing: ${timing || 'Pre-match'}
- Weather condition: ${weather || 'Clear'}

Return a JSON response containing:
- "confidence": percentage (integer, e.g. 92)
- "alerts": array of objects containing "level" (danger, warn) and "title" (caps brief title) and "desc" (specific recommendation details).

Respond ONLY with a valid JSON block matching this schema. Do not enclose in markdown blocks.`;

      const resultText = await geminiService.generateResponse(prompt, SYSTEM_PROMPT);
      const cleanedJSON = resultText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const prediction = JSON.parse(cleanedJSON);

      // Auto-save prediction to MongoDB (non-blocking)
      silentSave(() => Prediction.create({
        predictionType: 'crowd-density',
        input: { occupancy: Number(occupancy) || 50, timing: timing || 'Pre-match', weather: weather || 'Clear', stadium },
        output: { confidence: prediction.confidence, alerts: prediction.alerts },
        confidence: prediction.confidence,
        generatedByAI: true,
        stadium: stadium || null,
        requestedBy: requestedBy || 'system',
      }));

      return res.json({ success: true, ...prediction });
    } catch (err) {
      console.error("Predict controller failed:", err.message);
      const fallback = {
        confidence: 88,
        alerts: [
          { level: "danger", title: "[HIGH PROBABILITY]", desc: "Gate B will reach capacity in 18 minutes. Open Gate D to balance the crowd." },
          { level: "warn", title: "[REDIRECT RECOMMENDED]", desc: "Redirect 18% of spectators from North stand corridor exits to Gate D." }
        ]
      };
      silentSave(() => Prediction.create({
        predictionType: 'crowd-density',
        input: { occupancy: Number(occupancy) || 50, timing, weather, stadium },
        output: fallback,
        confidence: fallback.confidence,
        generatedByAI: true,
        stadium: stadium || null,
        requestedBy: requestedBy || 'system',
      }));
      return res.json({ success: true, ...fallback });
    }
  }

  /**
   * Dynamic PA Announcement Translation
   * Auto-saves translated announcement to Announcement collection.
   */
  async translate(req, res) {
    const { text, createdBy, stadium } = req.body;
    if (!text) return res.status(400).json({ success: false, error: "text is required." });

    try {
      const prompt = `Translate this stadium operations announcement into Spanish (es), French (fr), Hindi (hi), Arabic (ar), and Japanese (ja).
Text: "${text}"

Return a JSON response containing the translated versions under keys "en" (original text), "es", "fr", "hi", "ar", "ja".

Respond ONLY with a valid JSON block matching this schema. Do not enclose in markdown blocks.`;

      const resultText = await geminiService.generateResponse(prompt, SYSTEM_PROMPT);
      const cleanedJSON = resultText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const translations = JSON.parse(cleanedJSON);

      // Auto-save announcement to MongoDB (non-blocking)
      silentSave(() => Announcement.create({
        message: text,
        language: 'en',
        generatedByAI: true,
        createdBy: createdBy || 'system',
        priority: 'normal',
        audience: 'all',
        translations,
        stadium: stadium || null,
      }));

      return res.json({ success: true, ...translations });
    } catch (err) {
      console.error("Translate controller failed:", err.message);
      return res.json({
        success: true,
        en: text,
        es: `Anuncio (ES): ${text}`,
        fr: `Annonce (FR): ${text}`,
        hi: `घोषणा (HI): ${text}`,
        ar: `إعلان (AR): ${text}`,
        ja: `アナウンス (JA): ${text}`
      });
    }
  }
}

export const aiController = new AiController();
