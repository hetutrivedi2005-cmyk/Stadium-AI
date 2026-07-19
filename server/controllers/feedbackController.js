import Feedback from '../models/Feedback.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseFormatter.js';
import { getPagination } from '../utils/helpers.js';

class FeedbackController {
  async getAll(req, res) {
    const { page, limit, skip } = getPagination(req.query);
    const { category, stadium, rating } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (stadium) filter.stadium = stadium;
    if (rating) filter.rating = Number(rating);

    const [data, total] = await Promise.all([
      Feedback.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Feedback.countDocuments(filter),
    ]);
    return paginatedResponse(res, data, total, page, limit, 'Feedback retrieved');
  }

  async create(req, res) {
    const { user, rating, comment, category, stadium } = req.body;
    if (!rating) return errorResponse(res, 'rating is required', 400);
    if (rating < 1 || rating > 5) return errorResponse(res, 'rating must be between 1 and 5', 400);
    const feedback = await Feedback.create({ user, rating: Number(rating), comment, category, stadium });
    return successResponse(res, feedback, 'Feedback submitted', 201);
  }

  async getStats(req, res) {
    const [total, avgResult] = await Promise.all([
      Feedback.countDocuments(),
      Feedback.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }]),
    ]);
    const avg = avgResult[0]?.avg?.toFixed(2) || 0;
    return successResponse(res, { total, averageRating: parseFloat(avg) }, 'Feedback stats');
  }
}

export const feedbackController = new FeedbackController();
