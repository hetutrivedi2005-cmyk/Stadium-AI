import { errorResponse } from '../utils/responseFormatter.js';
import { formatValidationErrors, isDuplicateKeyError, getDuplicateField } from '../utils/helpers.js';
import logger from '../utils/logger.js';

/**
 * Global error handling middleware.
 * Must have 4 parameters to be recognized as error middleware by Express.
 */
const errorHandler = (err, req, res, next) => {
  logger.error(`${req.method} ${req.originalUrl} →`, err.message);

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = formatValidationErrors(err);
    return errorResponse(res, 'Validation failed', 422, errors);
  }

  // Mongoose Duplicate Key
  if (isDuplicateKeyError(err)) {
    return errorResponse(res, getDuplicateField(err), 409);
  }

  // Mongoose Cast Error (invalid ObjectId)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return errorResponse(res, 'Invalid resource ID format', 400);
  }

  // JWT / Auth Errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Unauthorized: Invalid or expired token', 401);
  }

  // MongoDB Connection Errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongoServerSelectionError') {
    return errorResponse(res, 'Database temporarily unavailable. Please retry.', 503);
  }

  // Generic server error
  return errorResponse(res, err.message || 'Internal server error', err.statusCode || 500);
};

export default errorHandler;
