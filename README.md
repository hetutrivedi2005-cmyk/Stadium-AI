# 🏟️ StadiumAI — The Tournament Operating System

> **FIFA World Cup 2026 | Real-Time Stadium Intelligence Platform**

StadiumAI is a production-ready, AI-powered stadium operations platform built for the FIFA World Cup 2026. It provides real-time crowd management, AI-assisted incident response, multilingual announcements, smart transit coordination, and volunteer management — all in a single unified dashboard.

---

## 📊 System Design & Class Diagram

### 🧱 System Architecture

```mermaid
graph TD
    subgraph Client ["Client (Frontend)"]
        UI["StadiumAI UI (HTML/CSS/JS)"]
        Three["Three.js (3D Stadium Visualization)"]
        FB_Auth["Firebase Authentication (Client-side)"]
    end

    subgraph Server ["Server (Express Backend)"]
        Router["Express Router (12 Route Groups)"]
        Controllers["Controllers (CRUD + Business Logic)"]
        AI_Controller["AI Controller (Gemini Integration)"]
        Mongoose["Mongoose ORM Layer"]
        Services["API Services (Weather, News, Football)"]
    end

    subgraph External ["External Services"]
        Gemini["Google Gemini AI API"]
        WeatherAPI["OpenWeatherMap API"]
        FootballAPI["Football-Data.org API"]
        NewsAPI["NewsAPI.org API"]
    end

    subgraph DB ["Database (Persistence)"]
        Atlas["MongoDB Atlas Cloud Database"]
    end

    UI -->|HTTPS Requests| Router
    UI -->|Token Authentication| FB_Auth
    Router --> Controllers
    Controllers --> Mongoose
    AI_Controller --> Services
    AI_Controller -->|AI Prompt generation| Gemini
    Services --> WeatherAPI
    Services --> FootballAPI
    Services --> NewsAPI
    Mongoose -->|Read/Write Queries| Atlas
    AI_Controller -->|Non-blocking Auto-saves| Mongoose
```

### 🗄️ Database Class & Schema Diagram (Mongoose)

```mermaid
classDiagram
    class User {
        +String uid (Firebase UID) [PK]
        +String email
        +String name
        +String role (fan, volunteer, organizer, security, medical-staff, admin, guest)
        +String photo
        +String phone
        +String language
        +String favoriteTeam
        +Boolean isActive
        +Date createdAt
        +Date updatedAt
    }

    class Incident {
        +ObjectId _id [PK]
        +String title
        +String description
        +String severity (LOW, MEDIUM, HIGH, CRITICAL)
        +String status (open, in-progress, resolved)
        +String category (security, medical, fire, crowd, facility, transit, weather, other)
        +String location
        +String stadium
        +String reportedBy
        +Boolean aiGenerated
        +Object aiPlaybook
        +Date createdAt
        +Date updatedAt
    }

    class Announcement {
        +ObjectId _id [PK]
        +String message
        +String language
        +Boolean generatedByAI
        +String createdBy
        +String priority (normal, high, critical)
        +String audience (all, volunteers, organizers, security, medical, spectators)
        +Object translations
        +String stadium
        +Boolean isActive
        +Date createdAt
        +Date updatedAt
    }

    class VolunteerTask {
        +ObjectId _id [PK]
        +String title
        +String description
        +String assignedTo (User UID)
        +String priority (low, medium, high, critical)
        +String status (pending, in-progress, completed, cancelled)
        +String location
        +String stadium
        +Date deadline
        +String aiAdvice
        +String eta
        +String distance
        +String riskLevel (low, medium, high)
        +Date createdAt
        +Date updatedAt
    }

    class Prediction {
        +ObjectId _id [PK]
        +String predictionType (crowd-density, egress-flow, incident-risk, weather-impact, other)
        +Object input
        +Object output
        +Number confidence
        +Boolean generatedByAI
        +String stadium
        +String requestedBy
        +Date createdAt
        +Date updatedAt
    }

    class Feedback {
        +ObjectId _id [PK]
        +String user (User UID or anonymous)
        +Number rating (1-5)
        +String comment
        +String category (general, navigation, ai-assistant, transit, accessibility, safety, app-performance)
        +String stadium
        +Date createdAt
        +Date updatedAt
    }

    class ChatHistory {
        +ObjectId _id [PK]
        +String userId (User UID or anonymous)
        +String role
        +String prompt
        +String response
        +String language
        +String stadium
        +Object weatherContext
        +String sessionId
        +String model
        +Date createdAt
        +Date updatedAt
    }

    class Stadium {
        +String stadiumId [PK]
        +String name
        +String city
        +String country
        +Number capacity
        +String address
        +Object coordinates
        +Array gates
        +Array parking
        +Array restaurants
        +Array foodCourts
        +Array medicalCenters
        +Array washrooms
        +Array fanZones
        +Object transport
        +Array nearbyHotels
        +Array nearbyHospitals
        +Array nearbyPolice
        +String openingHours
        +String closingHours
        +Array images
        +Boolean isActive
        +Date createdAt
        +Date updatedAt
    }

    class WeatherCache {
        +String stadium [PK]
        +Number temperature
        +Number feelsLike
        +Number humidity
        +Number wind
        +String windDirection
        +String condition
        +String conditionDesc
        +Number uvIndex
        +Number rainProbability
        +Number visibility
        +Number pressure
        +Number lat
        +Number lon
        +Date apiTimestamp
        +Date cachedAt [TTL Index]
    }

    class NewsCache {
        +ObjectId _id [PK]
        +String title
        +String source
        +String description
        +String url
        +String urlToImage
        +String category (football, world-cup, stadium, transport, weather, general)
        +String query
        +Date publishedAt
        +Date cachedAt [TTL Index]
    }

    User "1" --> "many" VolunteerTask : assigned tasks (uid)
    User "1" --> "many" Feedback : submits (uid/anonymous)
    User "1" --> "many" ChatHistory : chats (uid/anonymous)
    Stadium "1" --> "many" Incident : venues
    Stadium "1" --> "many" Announcement : locations
    Stadium "1" --> "many" VolunteerTask : tasks
    Stadium "1" --> "many" Prediction : telemetry
    Stadium "1" --> "1" WeatherCache : updates
```

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Assistant** | Gemini-powered chatbot for fans, volunteers, security, and medical staff |
| 👁️ **Crowd Intelligence** | Real-time crowd density prediction and bottleneck alerts |
| 🚨 **Incident Command** | AI-generated incident playbooks with volunteer dispatch |
| 📢 **Multilingual PA** | Translate announcements to EN, ES, FR, HI, AR, JA instantly |
| 🚌 **Smart Transit** | Live metro, bus, rideshare, and parking coordination |
| ♿ **Accessibility Hub** | High-contrast mode, audio cues, wheelchair routing |
| 🌤️ **Live Weather** | Real-time weather via OpenWeatherMap integrated into AI context |
| 🗺️ **Geolocation** | User-to-stadium distance, nearest gate routing |
| 📰 **News Feed** | Live FIFA World Cup 2026 news feed |
| 👤 **Auth & Profiles** | Firebase Authentication with role-based access |
| 🗄️ **MongoDB Backend** | Full Atlas-connected REST API with 10 data models |

---

## 🏗️ Reorganized Architecture

```
stadium-ai/
├── client/                 # Frontend Static Directory (Vercel)
│   ├── index.html          # Main web application entry point
│   ├── assets/             # 3D assets and static images
│   ├── data/               # Static venue JSON database
│   ├── src/                # Front-end UI and service logic modules
│   ├── package.json        # Client dependencies & scripts
│   └── vercel.json         # Vercel static router configurations
├── server/                 # Express REST API Backend (Render)
│   ├── config/             # DB configurations
│   ├── controllers/        # Route controllers
│   ├── data/               # AI backend local data copies
│   ├── middleware/         # App middleware
│   ├── models/             # Mongoose schemas
│   ├── routes/             # REST route files
│   ├── services/           # Backend API clients
│   ├── utils/              # Shared helper functions
│   ├── index.js            # Main backend entry point
│   ├── .env.example        # Environment variable sample
│   └── package.json        # Server configurations
├── package.json            # Workspace dev scripts (root)
└── README.md               # Main instructions
```

---

## 🚀 Local Development

### 1. Install Workspace Dependencies
Run from the root directory to install client and server packages simultaneously:
```bash
npm run install-all
```

### 2. Configure Environment Variables
Create a `.env` file inside the `server/` directory (use `server/.env.example` as a template):
```bash
cp server/.env.example server/.env
# Edit server/.env with your operational credentials
```

### 3. Start Development Servers
From the root directory:
*   To run the backend server: `npm run dev`
*   To run the frontend client: `npm run client`

---

## ☁️ Production Deployment

### 🖥️ Frontend (Vercel)
1.  Connect your GitHub repository to **Vercel**.
2.  Set the **Root Directory** to `client`.
3.  Add the optional environment variable `VITE_API_URL` pointing to your deployed Render URL (e.g. `https://your-backend.onrender.com/api`). If omitted, it will dynamically fall back to relative `/api` calls.
4.  Click **Deploy**. Vercel will host the client statically.

### 📡 Backend (Render)
1.  Create a new **Web Service** on **Render**.
2.  Select your repository and set the **Root Directory** to `server`.
3.  Set the **Start Command** to `npm start`.
4.  Configure all required environment variables (`MONGODB_URI`, `GEMINI_API_KEY`, etc.) in the Render dashboard settings.
5.  Click **Deploy**. Render will run the isolated Express REST backend.

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Server + MongoDB status |
| GET | `/api/dashboard/summary` | All stats in one call |
| POST | `/api/ai/chat` | Gemini chat (auto-saves to ChatHistory) |
| POST | `/api/ai/incident` | AI incident playbook (auto-saves to Incident) |
| POST | `/api/ai/predict` | Crowd prediction (auto-saves to Prediction) |
| POST | `/api/ai/translate` | PA announcement translation (auto-saves to Announcement) |
| GET/POST | `/api/users` | User management |
| GET/POST/PUT/DELETE | `/api/incidents` | Incident CRUD + stats |
| GET/POST/PUT/DELETE | `/api/announcements` | Announcement CRUD |
| GET/POST/PUT/DELETE | `/api/volunteer-tasks` | Volunteer task CRUD |
| GET/POST | `/api/predictions` | Prediction history |
| GET/POST | `/api/feedback` | Feedback + average rating |
| GET/POST | `/api/chat-history` | Chat session history |
| GET/POST/PUT/DELETE | `/api/stadiums` | Stadium database CRUD |
| GET/POST | `/api/weather-cache` | Weather cache (TTL: 30 min) |
| GET/POST | `/api/news-cache` | News cache (TTL: 1 hour) |

---

## 🛠️ Tech Stack

**Frontend**
- HTML5 + Vanilla CSS + JavaScript
- Three.js (3D stadium visualization)
- Firebase Authentication

**Backend**
- Node.js + Express.js
- MongoDB Atlas + Mongoose
- Google Gemini AI (`@google/genai`)
- OpenWeatherMap API
- Football-data API
- NewsAPI

---

## 🌍 Supported Languages

English · Español · Français · हिन्दी · العربية · 日本語

---

## 📸 Supported Stadiums

- 🇲🇽 Estadio Azteca — Mexico City
- 🇺🇸 SoFi Stadium — Los Angeles
- 🇺🇸 MetLife Stadium — New York

---

## ⚠️ Security Note

**Never commit your `.env` file.** Use `.env.example` as a template. The `.gitignore` excludes all `.env` files automatically.

---

## 🏆 Built For

**FIFA World Cup 2026 Hackathon** — Competing against 40+ AI projects.

> *"This must look like a funded startup's flagship product."*

---

*StadiumAI — Where Intelligence Meets the Beautiful Game.*
