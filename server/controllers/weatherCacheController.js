import WeatherCache from '../models/WeatherCache.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseFormatter.js';
import { getPagination } from '../utils/helpers.js';

class WeatherCacheController {
  async getAll(req, res) {
    const { page, limit, skip } = getPagination(req.query);
    const { stadium } = req.query;
    const filter = {};
    if (stadium) filter.stadium = stadium;

    const [data, total] = await Promise.all([
      WeatherCache.find(filter).sort({ cachedAt: -1 }).skip(skip).limit(limit).lean(),
      WeatherCache.countDocuments(filter),
    ]);
    return paginatedResponse(res, data, total, page, limit, 'Weather cache retrieved');
  }

  async getLatest(req, res) {
    const { stadium } = req.params;
    const entry = await WeatherCache.findOne({ stadium }).sort({ cachedAt: -1 }).lean();
    if (!entry) return errorResponse(res, 'No cached weather found for this stadium', 404);
    return successResponse(res, entry, 'Latest weather cache retrieved');
  }

  async create(req, res) {
    const { stadium, temperature, feelsLike, humidity, wind, condition, conditionDesc, uvIndex, rainProbability, visibility, pressure, lat, lon, apiTimestamp } = req.body;
    if (!stadium) return errorResponse(res, 'stadium is required', 400);
    const entry = await WeatherCache.create({ stadium, temperature, feelsLike, humidity, wind, condition, conditionDesc, uvIndex, rainProbability, visibility, pressure, lat, lon, apiTimestamp, cachedAt: new Date() });
    return successResponse(res, entry, 'Weather cached', 201);
  }
}

export const weatherCacheController = new WeatherCacheController();
