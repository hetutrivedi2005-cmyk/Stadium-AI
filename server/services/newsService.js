import dotenv from 'dotenv';
dotenv.config();

let cache = null;
let lastFetch = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache

const BACKUP_NEWS_DATA = {
  articles: [
    {
      title: "FIFA World Cup 2026™ Final Prepares for Kick-off",
      description: "Preparations are complete at MetLife Stadium for the historic match between Spain and Argentina. Over 82,000 spectators are arriving.",
      source: { name: "FIFA Official" },
      url: "https://www.fifa.com",
      urlToImage: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800",
      publishedAt: new Date().toISOString(),
      category: "fifa"
    },
    {
      title: "Transportation Alert: Metro Line 2 Running at High Frequency",
      description: "Transit systems have activated World Cup schedules. Trains are departing Fröttmaning Station and Meadowlands Loops every 2 minutes.",
      source: { name: "Transit Authority" },
      url: "https://www.stadium.ai",
      urlToImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800",
      publishedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
      category: "transport"
    },
    {
      title: "Security Advisory: Strict Bag Policy at Gates A and D",
      description: "Stadium security reminds fans that only clear bags under 12x6x12 inches will be admitted. Please arrive 2 hours prior to avoid delays.",
      source: { name: "Stadium Operations" },
      url: "https://www.stadium.ai",
      urlToImage: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=800",
      publishedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      category: "security"
    },
    {
      title: "Weather Alert: Showers Expected During Second Half",
      description: "Localized rain cells are approaching Coyoacán (Azteca) and East Rutherford (MetLife). Spectators are advised to bring lightweight rainwear.",
      source: { name: "Weather Service" },
      url: "https://www.stadium.ai",
      urlToImage: "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=800",
      publishedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      category: "weather"
    },
    {
      title: "Emergency Announcement: Lost Child Reunited Safely",
      description: "Operations Center reports the Lost Child protocol near Concourse B was engaged and resolved within 8 minutes. Thanks to Volunteer stewards.",
      source: { name: "ArenaMind Central" },
      url: "https://www.stadium.ai",
      urlToImage: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800",
      publishedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      category: "emergency"
    }
  ]
};

class NewsService {
  constructor() {
    this.apiKey = process.env.NEWS_API_KEY;
  }

  async getNews(query = "FIFA World Cup 2026") {
    if (!this.apiKey) {
      return BACKUP_NEWS_DATA;
    }

    if (cache && Date.now() - lastFetch < CACHE_TTL) {
      return cache;
    }

    try {
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&pageSize=10&apiKey=${this.apiKey}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status !== "ok") {
        throw new Error(data.message || "Failed to fetch from News API");
      }

      // Format articles and assign operational categories
      const articles = (data.articles || []).map((art, idx) => {
        let category = "fifa";
        const title = (art.title || "").toLowerCase();
        if (title.includes("transport") || title.includes("traffic") || title.includes("metro")) category = "transport";
        else if (title.includes("security") || title.includes("police") || title.includes("gate")) category = "security";
        else if (title.includes("weather") || title.includes("rain") || title.includes("temp")) category = "weather";
        else if (title.includes("emergency") || title.includes("critical")) category = "emergency";

        return {
          title: art.title,
          description: art.description || art.content || "No description available.",
          source: { name: art.source?.name || "News Network" },
          url: art.url || "https://www.stadium.ai",
          urlToImage: art.urlToImage || BACKUP_NEWS_DATA.articles[idx % BACKUP_NEWS_DATA.articles.length].urlToImage,
          publishedAt: art.publishedAt || new Date().toISOString(),
          category
        };
      });

      const finalArticles = articles.length > 0 ? articles : BACKUP_NEWS_DATA.articles;
      const result = { articles: finalArticles };

      cache = result;
      lastFetch = Date.now();
      return result;

    } catch (err) {
      console.warn("News API call failed, using mock data:", err.message);
      return BACKUP_NEWS_DATA;
    }
  }
}

export const newsService = new NewsService();
