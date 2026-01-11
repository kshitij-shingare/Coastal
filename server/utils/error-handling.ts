import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';
import { createErrorResponse } from '../../shared/types/api';

// Rate limiting store (in-memory for simplicity, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiter configuration
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export const apiRateLimiter: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
};

export const reportSubmitRateLimiter: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
};

// Request ID middleware
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}

// Input sanitization middleware
export function sanitizationMiddleware(req: Request, _res: Response, next: NextFunction): void {
  // Basic XSS prevention - strip script tags from string values
  const sanitize = (obj: Record<string, unknown>): Record<string, unknown> => {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = sanitize(value as Record<string, unknown>);
      } else {
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
export function rateLimitMiddleware(config: RateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
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
      res.status(429).json(
        createErrorResponse('RATE_LIMITED', 'Too many requests', `Try again in ${retryAfter} seconds`)
      );
      return;
    }

    clientData.count++;
    next();
  };
}

// 404 Not Found middleware
export function notFoundMiddleware(req: Request, res: Response): void {
  logger.warn(`Route not found: ${req.method} ${req.path}`);
  res.status(404).json(
    createErrorResponse('NOT_FOUND', 'The requested resource was not found', `${req.method} ${req.path}`)
  );
}

// Global error handler middleware
export function errorHandlerMiddleware(
  err: Error & { statusCode?: number; code?: string },
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.headers['x-request-id'] as string;
  
  logger.error('Unhandled error:', {
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

  res.status(statusCode).json(
    createErrorResponse(errorCode, message, process.env.NODE_ENV !== 'production' ? err.stack : undefined)
  );
}

// Custom error class
export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation error
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

// Not found error
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

// Unauthorized error
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

// Forbidden error
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export default {
  requestIdMiddleware,
  sanitizationMiddleware,
  rateLimitMiddleware,
  notFoundMiddleware,
  errorHandlerMiddleware,
  apiRateLimiter,
  reportSubmitRateLimiter,
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
};
