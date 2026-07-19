import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

// Load env variables first (resolves relative to this index.js file)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Database connection
import connectDB from './config/database.js';

// Middleware
import { requestLogger, notFoundHandler } from './middleware/requestLogger.js';
import errorHandler from './middleware/errorHandler.js';

// Existing services
import { weatherService } from './services/weatherService.js';
import { footballService } from './services/footballService.js';
import { newsService } from './services/newsService.js';

// All routes
import aiRoutes from './routes/ai.js';
import userRoutes from './routes/users.js';
import incidentRoutes from './routes/incidents.js';
import announcementRoutes from './routes/announcements.js';
import volunteerTaskRoutes from './routes/volunteerTasks.js';
import predictionRoutes from './routes/predictions.js';
import feedbackRoutes from './routes/feedback.js';
import chatHistoryRoutes from './routes/chatHistory.js';
import stadiumRoutes from './routes/stadiums.js';
import weatherCacheRoutes from './routes/weatherCache.js';
import newsCacheRoutes from './routes/newsCache.js';
import dashboardRoutes from './routes/dashboard.js';

// ─── Connect to MongoDB Atlas before starting Express ───────────────────────
await connectDB();

// ─── Express App ─────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3000;

// ─── Core Middleware ─────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    version: '2.0.0',
  });
});

// ─── AI Routes (Gemini — existing) ───────────────────────────────────────────
app.use('/api/ai', aiRoutes);

// ─── MongoDB REST API Routes ──────────────────────────────────────────────────
app.use('/api/users', userRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/volunteer-tasks', volunteerTaskRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/chat-history', chatHistoryRoutes);
app.use('/api/stadiums', stadiumRoutes);
app.use('/api/weather-cache', weatherCacheRoutes);
app.use('/api/news-cache', newsCacheRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ─── Legacy Direct API Endpoints (preserved from v1) ─────────────────────────
app.get('/api/weather', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ success: false, error: 'lat and lon query parameters are required.' });
  try {
    const data = await weatherService.getWeather(lat, lon);
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/football', async (req, res) => {
  try {
    const data = await footballService.getMatchData();
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/news', async (req, res) => {
  const { q } = req.query;
  try {
    const data = await newsService.getNews(q || 'FIFA World Cup 2026');
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 404 & Error Handlers ─────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`\n🏟️  StadiumAI Backend v2.0 running on port ${PORT}`);
  console.log(`📡 MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Connecting...'}`);
  console.log(`\n📋 API Endpoints:`);
  console.log(`   GET  /health`);
  console.log(`   POST /api/ai/chat             (Gemini + auto-saves to ChatHistory)`);
  console.log(`   POST /api/ai/incident         (Gemini + auto-saves to Incident)`);
  console.log(`   POST /api/ai/predict          (Gemini + auto-saves to Prediction)`);
  console.log(`   POST /api/ai/translate        (Gemini + auto-saves to Announcement)`);
  console.log(`   POST /api/ai/translate-text   (Gemini — direct translation)`);
  console.log(`   GET  /api/dashboard/summary   (Live MongoDB stats)`);
  console.log(`   REST /api/users               (CRUD)`);
  console.log(`   REST /api/incidents           (CRUD + stats)`);
  console.log(`   REST /api/announcements       (CRUD)`);
  console.log(`   REST /api/volunteer-tasks     (CRUD)`);
  console.log(`   REST /api/predictions         (GET, POST)`);
  console.log(`   REST /api/feedback            (GET, POST + stats)`);
  console.log(`   REST /api/chat-history        (GET, POST)`);
  console.log(`   REST /api/stadiums            (CRUD + /sid/:id)`);
  console.log(`   REST /api/weather-cache       (GET, POST)`);
  console.log(`   REST /api/news-cache          (GET, POST bulk)\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use.`);
    console.error(`   Run: netstat -ano | findstr :${PORT}`);
    console.error(`   Then: taskkill /PID <pid> /F\n`);
    process.exit(1);
  }
  throw err;
});

export default app;


