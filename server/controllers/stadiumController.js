import Stadium from '../models/Stadium.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseFormatter.js';
import { isValidObjectId, getPagination } from '../utils/helpers.js';

class StadiumController {
  async getAll(req, res) {
    const { page, limit, skip } = getPagination(req.query);
    const { country, city } = req.query;
    const filter = { isActive: true };
    if (country) filter.country = new RegExp(country, 'i');
    if (city) filter.city = new RegExp(city, 'i');

    const [data, total] = await Promise.all([
      Stadium.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      Stadium.countDocuments(filter),
    ]);
    return paginatedResponse(res, data, total, page, limit, 'Stadiums retrieved');
  }

  async getByStadiumId(req, res) {
    const stadium = await Stadium.findOne({ stadiumId: req.params.stadiumId, isActive: true }).lean();
    if (!stadium) return errorResponse(res, 'Stadium not found', 404);
    return successResponse(res, stadium, 'Stadium retrieved');
  }

  async create(req, res) {
    try {
      const stadium = await Stadium.create(req.body);
      return successResponse(res, stadium, 'Stadium created', 201);
    } catch (err) {
      if (err.code === 11000) return errorResponse(res, 'Stadium ID already exists', 409);
      throw err;
    }
  }

  async update(req, res) {
    if (!isValidObjectId(req.params.id)) return errorResponse(res, 'Invalid stadium ID', 400);
    const stadium = await Stadium.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
    if (!stadium) return errorResponse(res, 'Stadium not found', 404);
    return successResponse(res, stadium, 'Stadium updated');
  }

  async remove(req, res) {
    if (!isValidObjectId(req.params.id)) return errorResponse(res, 'Invalid stadium ID', 400);
    const stadium = await Stadium.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true }).lean();
    if (!stadium) return errorResponse(res, 'Stadium not found', 404);
    return successResponse(res, null, 'Stadium deactivated');
  }
}

export const stadiumController = new StadiumController();
