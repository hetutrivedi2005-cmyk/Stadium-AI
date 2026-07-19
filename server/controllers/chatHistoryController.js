import ChatHistory from '../models/ChatHistory.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseFormatter.js';
import { getPagination } from '../utils/helpers.js';

class ChatHistoryController {
  async getAll(req, res) {
    const { page, limit, skip } = getPagination(req.query);
    const { userId, sessionId, stadium } = req.query;
    const filter = {};
    if (userId) filter.userId = userId;
    if (sessionId) filter.sessionId = sessionId;
    if (stadium) filter.stadium = stadium;

    const [data, total] = await Promise.all([
      ChatHistory.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ChatHistory.countDocuments(filter),
    ]);
    return paginatedResponse(res, data, total, page, limit, 'Chat history retrieved');
  }

  async create(req, res) {
    const { userId, role, prompt, response, language, stadium, weatherContext, sessionId } = req.body;
    if (!prompt || !response) return errorResponse(res, 'prompt and response are required', 400);
    const chat = await ChatHistory.create({ userId, role, prompt, response, language, stadium, weatherContext, sessionId });
    return successResponse(res, chat, 'Chat history saved', 201);
  }
}

export const chatHistoryController = new ChatHistoryController();
