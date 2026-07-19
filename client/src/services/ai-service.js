import { apiClient } from '../utils/api-client.js';
import { API_ENDPOINTS, CONFIG } from '../config.js';
import { globalState } from '../state/global-state.js';

const ASSISTANT_LANGUAGES = {
  en: {
    greeting: "Hello! I am your AI Operations assistant. How can I help you manage the stadium today?",
    gateA: "Gate A is located in the East Concourse. It is currently at 42% capacity with a normal queue delay of 2 minutes.",
    washroom: "The nearest washrooms are located near Section 120 (Northeast) and Section 320 (Southwest). All are fully accessible.",
    emergency: "[CRITICAL] Medical emergency responders and security supervisors have been notified. Dispatching ambulance to gate coordinates.",
    lost: "Lost Child SOP has been engaged. Dispatching announcement to PA system and alerting volunteer network near your current sector.",
    transit: "Metro Subway Line 2 is currently running with a frequency of 2.5 minutes headways. Buses are experiencing minor traffic delays.",
    schedule: "Match kick-off is at 20:00 local time. Current pre-match egress flow simulation is active.",
    default: "I have recorded your request. Adjusting command control console presets accordingly."
  },
  es: {
    greeting: "¡Hola! Soy tu asistente de operaciones de IA. ¿Cómo puedo ayudarte a gestionar el estadio hoy?",
    gateA: "La Puerta A está en el vestíbulo este. Capacidad al 42% y demoras de cola normales de 2 minutos.",
    washroom: "Los baños más cercanos se encuentran en la Sección 120 (Noreste) y la Sección 320 (Suroeste).",
    emergency: "[CRITICAL] Los servicios de emergencia médica han sido notificados. Ambulancia en camino.",
    lost: "Alerta de niño extraviado activada. Mensaje enviado al sistema de PA y red de voluntarios.",
    transit: "Metro Línea 2 operando cada 2.5 minutos. Autobuses presentan retrasos menores.",
    schedule: "El inicio del partido es a las 20:00. Simulación de flujo pre-partido activa.",
    default: "He registrado tu solicitud. Ajustando consola de operaciones."
  },
  fr: {
    greeting: "Bonjour! Je suis votre assistant d'exploitation IA. Comment puis-je vous aider à gérer le stade aujourd'hui?",
    gateA: "La porte A se trouve dans le hall Est. Actuellement à 42% de capacité avec 2 min d'attente.",
    washroom: "Les toilettes les plus proches sont situées près de la section 120 (Nord-Est) et de la section 320 (Sud-Ouest).",
    emergency: "[CRITICAL] Les secours médicaux et agents de sécurité ont été alertés. Ambulance dépêchée.",
    lost: "Procédure enfant perdu activée. Message diffusé sur les haut-parleurs et alerte aux bénévoles.",
    transit: "Ligne de métro 2 : rames toutes les 2,5 minutes. Légers retards sur les navettes.",
    schedule: "Le coup d'envoi est à 20h00. Simulation de flux d'entrée active.",
    default: "Votre demande a été prise en compte. Ajustement de la console."
  },
  pt: {
    greeting: "Olá! Sou o seu assistente de operações de IA. Como posso ajudar a gerenciar o estádio hoje?",
    gateA: "O Portão A está localizado no Consecuto Leste. Capacidade de 42% e fila de 2 minutos.",
    washroom: "Banheiros próximos estão na Seção 120 (Nordeste) e Seção 320 (Sudoeste).",
    emergency: "[CRITICAL] Equipe médica e supervisores alertados. Ambulância despachada.",
    lost: "SOP de Criança Perdida ativado. Anúncio enviado aos alto-falantes e voluntários.",
    transit: "Metrô Linha 2 operando com intervalos de 2,5 min. Ônibus com pequenos atrasos.",
    schedule: "Início do jogo às 20h00. Fluxo pré-jogo ativo.",
    default: "Solicitação registrada. Atualizando console."
  },
  hi: {
    greeting: "नमस्ते! मैं आपका एआई ऑपरेशंस सहायक हूँ। आज स्टेडियम प्रबंधन में मैं आपकी क्या मदद कर सकता हूँ?",
    gateA: "गेट ए ईस्ट कॉनकोर्स में है। यह अभी 42% क्षमता पर है, 2 मिनट की सामान्य कतार देरी के साथ।",
    washroom: "निकटतम शौचालय अनुभाग 120 (उत्तर-पूर्व) और अनुभाग 320 (दक्षिण-पश्चिम) के पास हैं।",
    emergency: "[CRITICAL] चिकित्सा आपातकालीन सेवा को सूचित कर दिया गया है। एम्बुलेंस भेजी जा रही है।",
    lost: "खोए हुए बच्चे का एसओपी सक्रिय कर दिया गया है। घोषणा प्रसारित की जा रही है।",
    transit: "मेट्रो लाइन 2 ढाई मिनट के अंतराल पर चल रही है। बस कतारों में मामूली देरी है।",
    schedule: "मैच 20:00 बजे शुरू होगा। प्री-मैच भीड़ सिमुलेशन सक्रिय है।",
    default: "अनुरोध दर्ज किया गया है। कंसोल अपडेट किया जा रहा है।"
  },
  ar: {
    greeting: "مرحباً! أنا مساعد عمليات الذكاء الاصطناعي. كيف يمكنني مساعدتك في إدارة الاستاد اليوم؟",
    gateA: "البوابة A تقع في الممر الشرقي. السعة الحالية 42% مع دقيقتين انتظار.",
    washroom: "أقرب دورات مياه تقع بالقرب من القسم 120 (الشمال الشرقي) والقسم 320 (الجنوب الغربي).",
    emergency: "[CRITICAL] تم إخطار فرق الطوارئ الطبية والأمنية. سيارة الإسعاف في الطريق.",
    lost: "تم تفعيل بروتوكول الطفل المفقود. جاري بث الإعلان في الإذاعة الداخلية وتنبيّه المتطوعين.",
    transit: "مترو الخط 2 يعمل بتواتر 2.5 دقيقة. الحافلات تواجه تأخيرات طفيفة.",
    schedule: "ركلة البداية في الساعة 20:00 بالتوقيت المحلي. محاكاة التدفق نشطة.",
    default: "تم تسجيل طلبك. جاري تحديث وحدة التحكم."
  }
};

class AiService {
  /**
   * Helper to query Express server, falling back to mock data if it fails
   */
  async _queryExpress(endpoint, body) {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }
      return await response.json();
    } catch (e) {
      console.warn(`Express backend query to ${endpoint} failed. Using mock fallback.`, e.message);
      return null;
    }
  }

  /**
   * Translates query text and queries the assistant LLM wrapper
   */
  async sendAssistantQuery(query, activeLang) {
    const user = globalState.get('user') || {};
    const role = user.role || 'fan';
    const activeVenue = globalState.get('activeVenueKey') || 'estadio-azteca';
    const metrics = globalState.get('metrics') || {};
    const weather = globalState.get('weather') || 'Clear';
    
    const userLocation = globalState.get('userLocationContext') || null;
    
    const context = {
      stadium: activeVenue,
      weather: weather,
      density: metrics.density || 50,
      language: activeLang,
      userLocation: userLocation
    };

    const mockFallback = () => {
      let replyText = ASSISTANT_LANGUAGES[activeLang].default;
      const lowerQuery = query.toLowerCase();
      
      if (lowerQuery.includes('gate d') || lowerQuery.includes('puerta d')) {
        replyText = activeLang === 'es' ? "La puerta D está en el pasillo oeste, actualmente al 22% de capacidad. Ruta limpia disponible." : "Gate D is at the West concourse, currently at 22% capacity. Clean route available.";
      } else if (lowerQuery.includes('gate a') || lowerQuery.includes('puerta a')) {
        replyText = ASSISTANT_LANGUAGES[activeLang].gateA;
      } else if (lowerQuery.includes('parking') || lowerQuery.includes('estacionamiento') || lowerQuery.includes('parqueo')) {
        replyText = activeLang === 'es' ? "El estacionamiento de la Zona D es el más cercano con 38% de espacios libres. La Zona A está saturada." : "Zone D parking is the nearest with 38% spaces remaining. Zone A is currently saturated.";
      } else if (lowerQuery.includes('food') || lowerQuery.includes('eat') || lowerQuery.includes('comida') || lowerQuery.includes('price') || lowerQuery.includes('$50') || lowerQuery.includes('under')) {
        replyText = activeLang === 'es' ? "Las concesiones 8 y 14 ofrecen tacos, hot dogs y refrescos por menos de $50." : "Concessions 8 and 14 offer tacos, hot dogs, and sodas under $50 local currency.";
      } else if (lowerQuery.includes('translate') || lowerQuery.includes('traduc') || lowerQuery.includes('spanish')) {
        replyText = activeLang === 'es' ? "La traducción al español es: 'Se espera lluvia. Puerta Sur cerrada.'" : "'Rain expected. South Gate closed.' translated to Spanish is: 'Se espera lluvia. Puerta Sur cerrada.'";
      } else if (lowerQuery.includes('section c') || lowerQuery.includes('sección c') || lowerQuery.includes('crowd')) {
        replyText = activeLang === 'es' ? "La sección C está actualmente al 88% de capacidad. Tiempos de espera altos. Use el pasillo 4." : "Section C is currently at 88% capacity. Dwell times are rising. Recommend using Corridor 4.";
      } else if (lowerQuery.includes('emergency exit') || lowerQuery.includes('exits') || lowerQuery.includes('salida')) {
        replyText = activeLang === 'es' ? "Las salidas de emergencia están ubicadas detrás de los Sectores 110, 220 y en las nueve puertas principales." : "Emergency exits are located behind Sectors 110, 220, and directly through all nine main gates.";
      } else if (lowerQuery.includes('washroom') || lowerQuery.includes('baño') || lowerQuery.includes('toilet')) {
        replyText = ASSISTANT_LANGUAGES[activeLang].washroom;
      } else if (lowerQuery.includes('emergency') || lowerQuery.includes('help') || lowerQuery.includes('urgencia')) {
        replyText = ASSISTANT_LANGUAGES[activeLang].emergency;
      } else if (lowerQuery.includes('lost') || lowerQuery.includes('child') || lowerQuery.includes('perdido')) {
        replyText = ASSISTANT_LANGUAGES[activeLang].lost;
      } else if (lowerQuery.includes('transport') || lowerQuery.includes('bus') || lowerQuery.includes('metro')) {
        replyText = ASSISTANT_LANGUAGES[activeLang].transit;
      } else if (lowerQuery.includes('schedule') || lowerQuery.includes('match') || lowerQuery.includes('partido')) {
        replyText = ASSISTANT_LANGUAGES[activeLang].schedule;
      }
      return replyText;
    };

    const res = await this._queryExpress('/ai/chat', { message: query, role, context });
    if (res && res.success) {
      return res.reply;
    }
    return mockFallback();
  }

  /**
   * AI Incident Analysis Playbook generation
   */
  async analyzeIncidentFeed(logText) {
    const mockFallback = () => {
      const lower = logText.toLowerCase();
      let risk = 'MEDIUM';
      let riskClass = 'medium';
      let summary = "Crowd gathering observed in local sector concourses, resulting in localized friction points.";
      let action = "Deploy local volunteer units to guide spectator overflow into peripheral gate paths.";
      let volunteers = "Assign 12 roaming stewards from Sector 100 to active choke points.";
      let emergency = "Clear secondary exit Corridor B and set overhead dynamic signage directions.";

      if (lower.includes('gate 7') || lower.includes('crowd gathering') || lower.includes('gate a')) {
        risk = 'HIGH';
        riskClass = 'high';
        summary = "Heavy density buildup near Gate 7 entry loop. Queue saturation exceeding turnstile processing capacity.";
        action = "Open Gate D immediately. Pause entry ticketing scan checkpoints for 90 seconds.";
        volunteers = "Dispatch 8 crowd-marshalling specialists and 4 supervisors to gate lobby.";
        emergency = "Activate standard overflow egress loops and redirect 18% of spectators to west wings.";
      } else if (lower.includes('fire') || lower.includes('smoke') || lower.includes('emergency') || lower.includes('alarm')) {
        risk = 'CRITICAL';
        riskClass = 'high';
        summary = "Active emergency event alert registered. High risk of localized panic in concourse segments.";
        action = "Initiate emergency ventilation protocols and broadcast safety announcements.";
        volunteers = "All nearby volunteer staff report to nearest exits to guide pedestrian routes.";
        emergency = "Deploy medic teams to coordinates. Evacuate Stand C via East corridors.";
      } else if (lower.includes('concession') || lower.includes('food') || lower.includes('line')) {
        risk = 'LOW';
        riskClass = 'low';
        summary = "Concession zone queue length expansion due to single payment terminal malfunction.";
        action = "Switch checkout terminals to offline-capable local mode. Update queue labels.";
        volunteers = "Deploy 2 hospitality assistants to coordinate card checkouts.";
        emergency = "None required. Concourse flow remains within safety thresholds.";
      }

      return { risk, riskClass, summary, action, volunteers, emergency };
    };

    const res = await this._queryExpress('/ai/incident', { logText });
    if (res && res.success) {
      return res;
    }
    return mockFallback();
  }

  /**
   * Fills translated announcement templates
   */
  async generateBroadcastTranslations(bulletinText) {
    const mockFallback = () => {
      const lower = bulletinText.toLowerCase();
      if (lower.includes('rain') || lower.includes('south gate')) {
        return {
          en: "Attention spectators: Expected rain is approaching the venue. South Gate is now closed. Please utilize the East concourse pathways to exit.",
          es: "Atención espectadores: Se acerca lluvia al recinto. La Puerta Sur está cerrada. Utilice las vías del pasillo este para salir.",
          fr: "Attention spectateurs: De la pluie est attendue sur le site. La porte sud est fermée. Veuillez emprunter les passages du hall Est pour sortir.",
          hi: "ध्यान दें दर्शकों: बारिश की संभावना है। साउथ गेट अब बंद कर दिया गया है। कृपया बाहर निकलने के लिए ईस्ट कॉनकोर्स के रास्तों का उपयोग करें।",
          ar: "تنبيه للجماهير: يُتوقع هطول الأمطار قريباً. تم إغلاق البوابة الجنوبية. يرجى استخدام ممرات الممر الشرقي للخروج.",
          ja: "観客の皆様へ注意喚起：会場に雨が近づいています。南ゲートは現在閉鎖されています。退場の際は東コンコースの通路をご利用ください。"
        };
      } else {
        return {
          en: `Announcement: ${bulletinText}`,
          es: `Anuncio (ES): ${bulletinText} - traducido al español.`,
          fr: `Annonce (FR): ${bulletinText} - traduit en français.`,
          hi: `घोषणा (HI): ${bulletinText} - हिंदी अनुवाद।`,
          ar: `إعلان (AR): ${bulletinText} - مترجم للعربية.`,
          ja: `アナウンス (JA): ${bulletinText} - 日本語翻訳。`
        };
      }
    };

    const res = await this._queryExpress('/ai/translate', { text: bulletinText });
    if (res && res.success) {
      return res;
    }
    return mockFallback();
  }

  /**
   * Crowd Prediction Endpoint
   */
  async predictCrowdIssues(occupancy, timing, weather) {
    const mockFallback = () => {
      let confidence = 85 + Math.floor(Math.random() * 10);
      let alerts = [
        { level: "danger", title: "[HIGH PROBABILITY]", desc: "Gate B will reach capacity in 18 minutes. Open Gate D to balance the crowd." },
        { level: "warn", title: "[REDIRECT RECOMMENDED]", desc: "Redirect 18% of spectators from North stand corridor exits to Gate D." }
      ];
      return { confidence, alerts };
    };

    const res = await this._queryExpress('/ai/predict', { occupancy, timing, weather });
    if (res && res.success) {
      return res;
    }
    return mockFallback();
  }

  /**
   * Translates arbitrary text naturally into targetLang using Gemini
   */
  async translateText(text, targetLang) {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/ai/translate-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang })
      });
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }
      const data = await response.json();
      if (data && data.success) {
        return data.translatedText;
      }
      return text;
    } catch (e) {
      console.warn("Gemini translation failed, returning original text:", e.message);
      return text;
    }
  }
}

export const aiService = new AiService();
export { ASSISTANT_LANGUAGES };
