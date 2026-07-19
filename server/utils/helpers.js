import mongoose from 'mongoose';

/**
 * Validates that a string is a valid MongoDB ObjectId.
 */
export const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Builds a pagination object from query params.
 */
export const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Formats a Mongoose validation error into a clean array.
 */
export const formatValidationErrors = (err) => {
  if (err.name === 'ValidationError') {
    return Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }
  return null;
};

/**
 * Checks if a Mongoose error is a duplicate key error.
 */
export const isDuplicateKeyError = (err) => err.code === 11000;

/**
 * Extracts duplicate field from a MongoDB duplicate key error.
 */
export const getDuplicateField = (err) => {
  const field = Object.keys(err.keyValue || {})[0];
  return field ? `${field} already exists` : 'Duplicate value';
};

/**
 * Formats ISO date string into human-readable.
 */
export const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};
