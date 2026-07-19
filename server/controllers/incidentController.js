import Incident from '../models/Incident.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseFormatter.js';
import { isValidObjectId, getPagination } from '../utils/helpers.js';

class IncidentController {
  async getAll(req, res) {
    const { page, limit, skip } = getPagination(req.query);
    const { status, severity, category, stadium } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (category) filter.category = category;
    if (stadium) filter.stadium = stadium;

    const [data, total] = await Promise.all([
      Incident.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Incident.countDocuments(filter),
    ]);
    return paginatedResponse(res, data, total, page, limit, 'Incidents retrieved');
  }

  async getById(req, res) {
    if (!isValidObjectId(req.params.id)) return errorResponse(res, 'Invalid incident ID', 400);
    const incident = await Incident.findById(req.params.id).lean();
    if (!incident) return errorResponse(res, 'Incident not found', 404);
    return successResponse(res, incident, 'Incident retrieved');
  }

  async create(req, res) {
    const { title, description, severity, category, location, stadium, reportedBy, aiGenerated, aiPlaybook } = req.body;
    if (!title || !description) return errorResponse(res, 'title and description are required', 400);
    const incident = await Incident.create({ title, description, severity, category, location, stadium, reportedBy, aiGenerated, aiPlaybook });
    return successResponse(res, incident, 'Incident created', 201);
  }

  async update(req, res) {
    if (!isValidObjectId(req.params.id)) return errorResponse(res, 'Invalid incident ID', 400);
    const incident = await Incident.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
    if (!incident) return errorResponse(res, 'Incident not found', 404);
    return successResponse(res, incident, 'Incident updated');
  }

  async remove(req, res) {
    if (!isValidObjectId(req.params.id)) return errorResponse(res, 'Invalid incident ID', 400);
    const incident = await Incident.findByIdAndDelete(req.params.id).lean();
    if (!incident) return errorResponse(res, 'Incident not found', 404);
    return successResponse(res, null, 'Incident deleted');
  }

  async getStats(req, res) {
    const [open, resolved, critical, total] = await Promise.all([
      Incident.countDocuments({ status: 'open' }),
      Incident.countDocuments({ status: 'resolved' }),
      Incident.countDocuments({ severity: 'CRITICAL' }),
      Incident.countDocuments(),
    ]);
    return successResponse(res, { total, open, resolved, critical }, 'Incident stats');
  }
}

export const incidentController = new IncidentController();
