/**
 * Authentication Routes
 * 
 * Handles user registration, login, and token refresh.
 * Validates: Requirements 10.1, 10.2
 */

import express, { Request, Response } from 'express';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';
import { createSuccessResponse, createErrorResponse } from '../../../shared/types/api';
import {
  hashPassword,
  verifyPassword,
  generateTokenPair,
  verifyToken,
  validatePasswordStrength,
  User,
} from './auth-service';
import { rateLimitMiddleware, apiRateLimiter } from '../../utils/error-handling';

export const authRouter = express.Router();

// In-memory user store (replace with database in production)
const users = new Map<string, User>();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'any.required': 'Password is required',
  }),
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name must not exceed 100 characters',
    'any.required': 'Name is required',
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

// Apply rate limiting
authRouter.use(rateLimitMiddleware(apiRateLimiter));


/**
 * POST /api/auth/register
 * Register a new user
 */
authRouter.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = registerSchema.validate(req.body, { abortEarly: false });

    if (error) {
      const errorMessages = error.details.map(d => d.message).join(', ');
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Validation failed', errorMessages));
      return;
    }

    const { email, password, name } = value;

    // Check if user already exists
    const existingUser = Array.from(users.values()).find(u => u.email === email);
    if (existingUser) {
      res.status(409).json(createErrorResponse('CONFLICT', 'User already exists', 'An account with this email already exists'));
      return;
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Weak password', passwordValidation.errors.join(', ')));
      return;
    }

    // Create user
    const passwordHash = await hashPassword(password);
    const user: User = {
      id: uuidv4(),
      email,
      passwordHash,
      name,
      role: 'user',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    users.set(user.id, user);

    // Generate tokens
    const tokens = generateTokenPair(user);

    logger.info('User registered', { userId: user.id, email: user.email });

    res.status(201).json(createSuccessResponse({
      message: 'Registration successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    }));
  } catch (err) {
    logger.error('Registration error:', err);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Registration failed'));
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = loginSchema.validate(req.body);

    if (error) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Invalid credentials format'));
      return;
    }

    const { email, password } = value;

    // Find user
    const user = Array.from(users.values()).find(u => u.email === email);
    if (!user) {
      res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Invalid credentials'));
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(403).json(createErrorResponse('FORBIDDEN', 'Account is disabled'));
      return;
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Invalid credentials'));
      return;
    }

    // Generate tokens
    const tokens = generateTokenPair(user);

    logger.info('User logged in', { userId: user.id, email: user.email });

    res.json(createSuccessResponse({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    }));
  } catch (err) {
    logger.error('Login error:', err);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Login failed'));
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
authRouter.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = refreshSchema.validate(req.body);

    if (error) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Refresh token is required'));
      return;
    }

    const { refreshToken } = value;

    // Verify refresh token
    const payload = verifyToken(refreshToken);
    if (!payload || payload.type !== 'refresh') {
      res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Invalid refresh token'));
      return;
    }

    // Find user
    const user = users.get(payload.userId);
    if (!user || !user.isActive) {
      res.status(401).json(createErrorResponse('UNAUTHORIZED', 'User not found or inactive'));
      return;
    }

    // Generate new tokens
    const tokens = generateTokenPair(user);

    logger.debug('Token refreshed', { userId: user.id });

    res.json(createSuccessResponse({
      message: 'Token refreshed',
      ...tokens,
    }));
  } catch (err) {
    logger.error('Token refresh error:', err);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Token refresh failed'));
  }
});

/**
 * GET /api/auth/me
 * Get current user info (requires authentication)
 */
authRouter.get('/me', (req: Request, res: Response): void => {
  // This would use authMiddleware in production
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json(createErrorResponse('UNAUTHORIZED', 'No token provided'));
    return;
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload || payload.type !== 'access') {
    res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Invalid token'));
    return;
  }

  const user = users.get(payload.userId);
  if (!user) {
    res.status(404).json(createErrorResponse('NOT_FOUND', 'User not found'));
    return;
  }

  res.json(createSuccessResponse({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    },
  }));
});

export const authRoutesModule = {
  router: authRouter,
};

export default authRoutesModule;
