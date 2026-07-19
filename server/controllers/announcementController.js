import Announcement from '../models/Announcement.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseFormatter.js';
import { isValidObjectId, getPagination } from '../utils/helpers.js';

class AnnouncementController {
  async getAll(req, res) {
    const { page, limit, skip } = getPagination(req.query);
    const { priority, audience, language, stadium, isActive } = req.query;
    const filter = {};
    if (priority) filter.priority = priority;
    if (audience) filter.audience = audience;
    if (language) filter.language = language;
    if (stadium) filter.stadium = stadium;
    if (isActive !== undefined) filter.isActive = isActive !== 'false';

    const [data, total] = await Promise.all([
      Announcement.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Announcement.countDocuments(filter),
    ]);
    return paginatedResponse(res, data, total, page, limit, 'Announcements retrieved');
  }

  async getById(req, res) {
    if (!isValidObjectId(req.params.id)) return errorResponse(res, 'Invalid announcement ID', 400);
    const ann = await Announcement.findById(req.params.id).lean();
    if (!ann) return errorResponse(res, 'Announcement not found', 404);
    return successResponse(res, ann, 'Announcement retrieved');
  }

  async create(req, res) {
    const { message, language, generatedByAI, createdBy, priority, audience, translations, stadium } = req.body;
    if (!message) return errorResponse(res, 'message is required', 400);
    const ann = await Announcement.create({ message, language, generatedByAI, createdBy, priority, audience, translations, stadium });
    return successResponse(res, ann, 'Announcement created', 201);
  }

  async update(req, res) {
    if (!isValidObjectId(req.params.id)) return errorResponse(res, 'Invalid announcement ID', 400);
    const ann = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
    if (!ann) return errorResponse(res, 'Announcement not found', 404);
    return successResponse(res, ann, 'Announcement updated');
  }

  async remove(req, res) {
    if (!isValidObjectId(req.params.id)) return errorResponse(res, 'Invalid announcement ID', 400);
    const ann = await Announcement.findByIdAndDelete(req.params.id).lean();
    if (!ann) return errorResponse(res, 'Announcement not found', 404);
    return successResponse(res, null, 'Announcement deleted');
  }
}

export const announcementController = new AnnouncementController();
