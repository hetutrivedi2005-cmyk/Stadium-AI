import VolunteerTask from '../models/VolunteerTask.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseFormatter.js';
import { isValidObjectId, getPagination } from '../utils/helpers.js';

class VolunteerTaskController {
  async getAll(req, res) {
    const { page, limit, skip } = getPagination(req.query);
    const { status, priority, assignedTo, stadium } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (stadium) filter.stadium = stadium;

    const [data, total] = await Promise.all([
      VolunteerTask.find(filter).sort({ priority: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      VolunteerTask.countDocuments(filter),
    ]);
    return paginatedResponse(res, data, total, page, limit, 'Volunteer tasks retrieved');
  }

  async getById(req, res) {
    if (!isValidObjectId(req.params.id)) return errorResponse(res, 'Invalid task ID', 400);
    const task = await VolunteerTask.findById(req.params.id).lean();
    if (!task) return errorResponse(res, 'Task not found', 404);
    return successResponse(res, task, 'Task retrieved');
  }

  async create(req, res) {
    const { title, description, assignedTo, priority, status, location, stadium, deadline, aiAdvice, eta, distance, riskLevel } = req.body;
    if (!title) return errorResponse(res, 'title is required', 400);
    const task = await VolunteerTask.create({ title, description, assignedTo, priority, status, location, stadium, deadline, aiAdvice, eta, distance, riskLevel });
    return successResponse(res, task, 'Volunteer task created', 201);
  }

  async update(req, res) {
    if (!isValidObjectId(req.params.id)) return errorResponse(res, 'Invalid task ID', 400);
    const task = await VolunteerTask.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
    if (!task) return errorResponse(res, 'Task not found', 404);
    return successResponse(res, task, 'Task updated');
  }

  async remove(req, res) {
    if (!isValidObjectId(req.params.id)) return errorResponse(res, 'Invalid task ID', 400);
    const task = await VolunteerTask.findByIdAndDelete(req.params.id).lean();
    if (!task) return errorResponse(res, 'Task not found', 404);
    return successResponse(res, null, 'Task deleted');
  }
}

export const volunteerTaskController = new VolunteerTaskController();
