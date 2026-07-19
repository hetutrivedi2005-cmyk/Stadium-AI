import dotenv from 'dotenv';
dotenv.config();

let GoogleGenAIClient = null;
try {
  const { GoogleGenAI } = await import('@google/genai');
  if (process.env.GEMINI_API_KEY) {
    GoogleGenAIClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    console.log("Successfully initialized GoogleGenAI client SDK.");
  }
} catch (e) {
  console.warn("Could not load @google/genai client SDK. Falling back to direct REST fetch fallback mode:", e.message);
}

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.modelName = 'gemini-3.5-flash'; // Standard operational LLM model
  }

  /**
   * Generates response from Gemini, supporting timeout and API failure fallbacks
   */
  async generateResponse(prompt, systemInstruction = '') {
    if (!this.apiKey) {
      throw new Error("Invalid API Key: GEMINI_API_KEY environment variable is missing.");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 seconds timeout limit

    try {
      if (GoogleGenAIClient) {
        // Use official SDK client
        const response = await GoogleGenAIClient.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: systemInstruction ? { systemInstruction } : undefined
        });
        clearTimeout(timeoutId);
        
        if (response && response.text) {
          return response.text;
        }
        throw new Error("Empty text returned from GoogleGenAI SDK.");
      } else {
        // Direct API REST fallback
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
        
        const contents = [];
        if (systemInstruction) {
          contents.push({
            role: 'user',
            parts: [{ text: `[SYSTEM PRESET]: ${systemInstruction}` }]
          });
        }
        contents.push({
          role: 'user',
          parts: [{ text: prompt }]
        });

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Gemini API HTTP Error Status: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return text;
        }
        throw new Error("Malformed JSON received from REST endpoint.");
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error("Request Timeout: Google Gemini API took too long to respond.");
      }
      throw err;
    }
  }
}

export const geminiService = new GeminiService();
