import NewsCache from '../models/NewsCache.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseFormatter.js';
import { getPagination } from '../utils/helpers.js';

class NewsCacheController {
  async getAll(req, res) {
    const { page, limit, skip } = getPagination(req.query);
    const { category, query } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (query) filter.query = query;

    const [data, total] = await Promise.all([
      NewsCache.find(filter).sort({ publishedAt: -1 }).skip(skip).limit(limit).lean(),
      NewsCache.countDocuments(filter),
    ]);
    return paginatedResponse(res, data, total, page, limit, 'News cache retrieved');
  }

  async bulkCreate(req, res) {
    const { articles, query } = req.body;
    if (!Array.isArray(articles) || articles.length === 0) {
      return errorResponse(res, 'articles array is required', 400);
    }
    const docs = articles.map((a) => ({ ...a, query: query || 'FIFA World Cup 2026', cachedAt: new Date() }));
    const inserted = await NewsCache.insertMany(docs, { ordered: false });
    return successResponse(res, { inserted: inserted.length }, 'News cached', 201);
  }
}

export const newsCacheController = new NewsCacheController();
