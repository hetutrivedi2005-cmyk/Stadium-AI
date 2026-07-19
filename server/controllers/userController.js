import User from '../models/User.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseFormatter.js';
import { isValidObjectId, getPagination, isDuplicateKeyError, getDuplicateField, formatValidationErrors } from '../utils/helpers.js';

class UserController {
  /** GET /api/users — list all users with pagination */
  async getAll(req, res) {
    const { page, limit, skip } = getPagination(req.query);
    const { role, isActive } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const [data, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);
    return paginatedResponse(res, data, total, page, limit, 'Users retrieved');
  }

  /** GET /api/users/:id — get user by MongoDB _id */
  async getById(req, res) {
    const { id } = req.params;
    if (!isValidObjectId(id)) return errorResponse(res, 'Invalid user ID', 400);
    const user = await User.findById(id).lean();
    if (!user) return errorResponse(res, 'User not found', 404);
    return successResponse(res, user, 'User retrieved');
  }

  /** GET /api/users/uid/:uid — get user by Firebase UID */
  async getByUid(req, res) {
    const user = await User.findOne({ uid: req.params.uid }).lean();
    if (!user) return errorResponse(res, 'User not found', 404);
    return successResponse(res, user, 'User retrieved');
  }

  /** POST /api/users — create or upsert user (called on Firebase login) */
  async create(req, res) {
    const { uid, name, email, role, photo, phone, language, favoriteTeam } = req.body;
    if (!uid || !name || !email) {
      return errorResponse(res, 'uid, name, and email are required', 400);
    }
    try {
      const user = await User.findOneAndUpdate(
        { uid },
        { uid, name, email, role: role || 'fan', photo, phone, language, favoriteTeam },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );
      return successResponse(res, user, 'User saved', 201);
    } catch (err) {
      if (isDuplicateKeyError(err)) return errorResponse(res, getDuplicateField(err), 409);
      const valErrors = formatValidationErrors(err);
      if (valErrors) return errorResponse(res, 'Validation failed', 422, valErrors);
      throw err;
    }
  }

  /** PUT /api/users/:id — update user */
  async update(req, res) {
    const { id } = req.params;
    if (!isValidObjectId(id)) return errorResponse(res, 'Invalid user ID', 400);
    const forbidden = ['uid', 'email', '_id'];
    forbidden.forEach((f) => delete req.body[f]);
    const user = await User.findByIdAndUpdate(id, req.body, { new: true, runValidators: true }).lean();
    if (!user) return errorResponse(res, 'User not found', 404);
    return successResponse(res, user, 'User updated');
  }

  /** DELETE /api/users/:id — soft-delete (set isActive=false) */
  async remove(req, res) {
    const { id } = req.params;
    if (!isValidObjectId(id)) return errorResponse(res, 'Invalid user ID', 400);
    const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
    if (!user) return errorResponse(res, 'User not found', 404);
    return successResponse(res, null, 'User deactivated');
  }
}

export const userController = new UserController();
