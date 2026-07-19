import User from '../models/User.js';
import Incident from '../models/Incident.js';
import Announcement from '../models/Announcement.js';
import VolunteerTask from '../models/VolunteerTask.js';
import Prediction from '../models/Prediction.js';
import Feedback from '../models/Feedback.js';
import ChatHistory from '../models/ChatHistory.js';
import Stadium from '../models/Stadium.js';
import WeatherCache from '../models/WeatherCache.js';
import NewsCache from '../models/NewsCache.js';
import { successResponse } from '../utils/responseFormatter.js';

class DashboardController {
  async getSummary(req, res) {
    const [
      totalUsers,
      activeVolunteers,
      openIncidents,
      resolvedIncidents,
      criticalIncidents,
      totalAnnouncements,
      activeAnnouncements,
      totalPredictions,
      totalFeedback,
      feedbackStats,
      totalChats,
      connectedStadiums,
      latestAnnouncements,
      latestIncidents,
      latestPredictions,
      weatherEntries,
      newsEntries,
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'volunteer', isActive: true }),
      Incident.countDocuments({ status: 'open' }),
      Incident.countDocuments({ status: 'resolved' }),
      Incident.countDocuments({ severity: 'CRITICAL', status: { $in: ['open', 'in-progress'] } }),
      Announcement.countDocuments(),
      Announcement.countDocuments({ isActive: true }),
      Prediction.countDocuments(),
      Feedback.countDocuments(),
      Feedback.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' } } }]),
      ChatHistory.countDocuments(),
      Stadium.countDocuments({ isActive: true }),
      Announcement.find({ isActive: true }).sort({ createdAt: -1 }).limit(5).lean(),
      Incident.find({ status: 'open' }).sort({ createdAt: -1 }).limit(5).lean(),
      Prediction.find().sort({ createdAt: -1 }).limit(3).lean(),
      WeatherCache.countDocuments(),
      NewsCache.countDocuments(),
    ]);

    const averageRating = feedbackStats[0]?.avg?.toFixed(2) || 0;

    return successResponse(res, {
      users: { total: totalUsers, activeVolunteers },
      incidents: { open: openIncidents, resolved: resolvedIncidents, critical: criticalIncidents },
      announcements: { total: totalAnnouncements, active: activeAnnouncements },
      predictions: { total: totalPredictions },
      feedback: { total: totalFeedback, averageRating: parseFloat(averageRating) },
      chats: { total: totalChats },
      stadiums: { connected: connectedStadiums },
      cache: { weather: weatherEntries, news: newsEntries },
      latest: {
        announcements: latestAnnouncements,
        incidents: latestIncidents,
        predictions: latestPredictions,
      },
    }, 'Dashboard summary loaded');
  }
}

export const dashboardController = new DashboardController();
