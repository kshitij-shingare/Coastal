"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.ValidationError = exports.AppError = exports.reportSubmitRateLimiter = exports.apiRateLimiter = void 0;
exports.requestIdMiddleware = requestIdMiddleware;
exports.sanitizationMiddleware = sanitizationMiddleware;
exports.rateLimitMiddleware = rateLimitMiddleware;
exports.notFoundMiddleware = notFoundMiddleware;
exports.errorHandlerMiddleware = errorHandlerMiddleware;
const uuid_1 = require("uuid");
const logger_1 = require("./logger");
const api_1 = require("../../shared/types/api");
// Rate limiting store (in-memory for simplicity, use Redis in production)
const rateLimitStore = new Map();
exports.apiRateLimiter = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
};
exports.reportSubmitRateLimiter = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
};
// Request ID middleware
function requestIdMiddleware(req, res, next) {
    const requestId = req.headers['x-request-id'] || (0, uuid_1.v4)();
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
}
// Input sanitization middleware
function sanitizationMiddleware(req, _res, next) {
    // Basic XSS prevention - strip script tags from string values
    const sanitize = (obj) => {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            }
            else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                sanitized[key] = sanitize(value);
            }
            else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    };
    if (req.body && typeof req.body === 'object') {
        req.body = sanitize(req.body);
    }
    next();
}
// Rate limiting middleware factory
function rateLimitMiddleware(config) {
    return (req, res, next) => {
        const clientId = req.ip || req.headers['x-forwarded-for'] || 'unknown';
        const now = Date.now();
        const clientData = rateLimitStore.get(clientId);
        if (!clientData || now > clientData.resetTime) {
            // New window
            rateLimitStore.set(clientId, {
                count: 1,
                resetTime: now + config.windowMs,
            });
            next();
            return;
        }
        if (clientData.count >= config.maxRequests) {
            const retryAfter = Math.ceil((clientData.resetTime - now) / 1000);
            res.setHeader('Retry-After', retryAfter.toString());
            res.status(429).json((0, api_1.createErrorResponse)('RATE_LIMITED', 'Too many requests', `Try again in ${retryAfter} seconds`));
            return;
        }
        clientData.count++;
        next();
    };
}
// 404 Not Found middleware
function notFoundMiddleware(req, res) {
    logger_1.logger.warn(`Route not found: ${req.method} ${req.path}`);
    res.status(404).json((0, api_1.createErrorResponse)('NOT_FOUND', 'The requested resource was not found', `${req.method} ${req.path}`));
}
// Global error handler middleware
function errorHandlerMiddleware(err, req, res, _next) {
    const requestId = req.headers['x-request-id'];
    logger_1.logger.error('Unhandled error:', {
        error: err.message,
        stack: err.stack,
        requestId,
        path: req.path,
        method: req.method,
    });
    const statusCode = err.statusCode || 500;
    const errorCode = err.code || 'INTERNAL_ERROR';
    const message = process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message;
    res.status(statusCode).json((0, api_1.createErrorResponse)(errorCode, message, process.env.NODE_ENV !== 'production' ? err.stack : undefined));
}
// Custom error class
class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
// Validation error
class ValidationError extends AppError {
    constructor(message) {
        super(message, 400, 'VALIDATION_ERROR');
    }
}
exports.ValidationError = ValidationError;
// Not found error
class NotFoundError extends AppError {
    constructor(resource) {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}
exports.NotFoundError = NotFoundError;
// Unauthorized error
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401, 'UNAUTHORIZED');
    }
}
exports.UnauthorizedError = UnauthorizedError;
// Forbidden error
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403, 'FORBIDDEN');
    }
}
exports.ForbiddenError = ForbiddenError;
exports.default = {
    requestIdMiddleware,
    sanitizationMiddleware,
    rateLimitMiddleware,
    notFoundMiddleware,
    errorHandlerMiddleware,
    apiRateLimiter: exports.apiRateLimiter,
    reportSubmitRateLimiter: exports.reportSubmitRateLimiter,
    AppError,
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
};
//# sourceMappingURL=error-handling.js.map