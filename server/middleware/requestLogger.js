import logger from '../utils/logger.js';
import { errorResponse } from '../utils/responseFormatter.js';

/**
 * Request logger middleware — logs method, path, IP, and response time.
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logFn = res.statusCode >= 400 ? logger.warn : logger.info;
    logFn(`${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms) IP: ${req.ip}`);
  });
  next();
};

/**
 * 404 Not Found handler — must be registered AFTER all routes.
 */
export const notFoundHandler = (req, res) => {
  return errorResponse(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};

/**
 * Basic rate limit guard for AI endpoints (prevents runaway calls).
 * Production apps should use express-rate-limit instead.
 */
const requestCounts = new Map();

export const simpleRateLimit = (maxRequests = 30, windowMs = 60000) => (req, res, next) => {
  const key = req.ip;
  const now = Date.now();

  if (!requestCounts.has(key)) {
    requestCounts.set(key, { count: 1, start: now });
    return next();
  }

  const entry = requestCounts.get(key);
  if (now - entry.start > windowMs) {
    requestCounts.set(key, { count: 1, start: now });
    return next();
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return errorResponse(res, 'Too many requests. Please wait a moment.', 429);
  }

  next();
};
