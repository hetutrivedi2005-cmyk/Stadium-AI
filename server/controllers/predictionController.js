import Prediction from '../models/Prediction.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseFormatter.js';
import { isValidObjectId, getPagination } from '../utils/helpers.js';

class PredictionController {
  async getAll(req, res) {
    const { page, limit, skip } = getPagination(req.query);
    const { predictionType, stadium } = req.query;
    const filter = {};
    if (predictionType) filter.predictionType = predictionType;
    if (stadium) filter.stadium = stadium;

    const [data, total] = await Promise.all([
      Prediction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Prediction.countDocuments(filter),
    ]);
    return paginatedResponse(res, data, total, page, limit, 'Predictions retrieved');
  }

  async create(req, res) {
    const { predictionType, input, output, confidence, generatedByAI, stadium, requestedBy } = req.body;
    if (!output) return errorResponse(res, 'output is required', 400);
    const prediction = await Prediction.create({ predictionType, input, output, confidence, generatedByAI, stadium, requestedBy });
    return successResponse(res, prediction, 'Prediction saved', 201);
  }
}

export const predictionController = new PredictionController();
