"use strict";
/**
 * Authentication Routes
 *
 * Handles user registration, login, and token refresh.
 * Validates: Requirements 10.1, 10.2
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutesModule = exports.authRouter = void 0;
const express_1 = __importDefault(require("express"));
const joi_1 = __importDefault(require("joi"));
const uuid_1 = require("uuid");
const logger_1 = require("../../utils/logger");
const api_1 = require("../../../shared/types/api");
const auth_service_1 = require("./auth-service");
const error_handling_1 = require("../../utils/error-handling");
exports.authRouter = express_1.default.Router();
// In-memory user store (replace with database in production)
const users = new Map();
// Validation schemas
const registerSchema = joi_1.default.object({
    email: joi_1.default.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
    }),
    password: joi_1.default.string().min(8).required().messages({
        'string.min': 'Password must be at least 8 characters',
        'any.required': 'Password is required',
    }),
    name: joi_1.default.string().min(2).max(100).required().messages({
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name must not exceed 100 characters',
        'any.required': 'Name is required',
    }),
});
const loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().required(),
});
const refreshSchema = joi_1.default.object({
    refreshToken: joi_1.default.string().required(),
});
// Apply rate limiting
exports.authRouter.use((0, error_handling_1.rateLimitMiddleware)(error_handling_1.apiRateLimiter));
/**
 * POST /api/auth/register
 * Register a new user
 */
exports.authRouter.post('/register', async (req, res) => {
    try {
        const { error, value } = registerSchema.validate(req.body, { abortEarly: false });
        if (error) {
            const errorMessages = error.details.map(d => d.message).join(', ');
            res.status(400).json((0, api_1.createErrorResponse)('VALIDATION_ERROR', 'Validation failed', errorMessages));
            return;
        }
        const { email, password, name } = value;
        // Check if user already exists
        const existingUser = Array.from(users.values()).find(u => u.email === email);
        if (existingUser) {
            res.status(409).json((0, api_1.createErrorResponse)('CONFLICT', 'User already exists', 'An account with this email already exists'));
            return;
        }
        // Validate password strength
        const passwordValidation = (0, auth_service_1.validatePasswordStrength)(password);
        if (!passwordValidation.valid) {
            res.status(400).json((0, api_1.createErrorResponse)('VALIDATION_ERROR', 'Weak password', passwordValidation.errors.join(', ')));
            return;
        }
        // Create user
        const passwordHash = await (0, auth_service_1.hashPassword)(password);
        const user = {
            id: (0, uuid_1.v4)(),
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
        const tokens = (0, auth_service_1.generateTokenPair)(user);
        logger_1.logger.info('User registered', { userId: user.id, email: user.email });
        res.status(201).json((0, api_1.createSuccessResponse)({
            message: 'Registration successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            ...tokens,
        }));
    }
    catch (err) {
        logger_1.logger.error('Registration error:', err);
        res.status(500).json((0, api_1.createErrorResponse)('INTERNAL_ERROR', 'Registration failed'));
    }
});
/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
exports.authRouter.post('/login', async (req, res) => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            res.status(400).json((0, api_1.createErrorResponse)('VALIDATION_ERROR', 'Invalid credentials format'));
            return;
        }
        const { email, password } = value;
        // Find user
        const user = Array.from(users.values()).find(u => u.email === email);
        if (!user) {
            res.status(401).json((0, api_1.createErrorResponse)('UNAUTHORIZED', 'Invalid credentials'));
            return;
        }
        // Check if user is active
        if (!user.isActive) {
            res.status(403).json((0, api_1.createErrorResponse)('FORBIDDEN', 'Account is disabled'));
            return;
        }
        // Verify password
        const isValid = await (0, auth_service_1.verifyPassword)(password, user.passwordHash);
        if (!isValid) {
            res.status(401).json((0, api_1.createErrorResponse)('UNAUTHORIZED', 'Invalid credentials'));
            return;
        }
        // Generate tokens
        const tokens = (0, auth_service_1.generateTokenPair)(user);
        logger_1.logger.info('User logged in', { userId: user.id, email: user.email });
        res.json((0, api_1.createSuccessResponse)({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            ...tokens,
        }));
    }
    catch (err) {
        logger_1.logger.error('Login error:', err);
        res.status(500).json((0, api_1.createErrorResponse)('INTERNAL_ERROR', 'Login failed'));
    }
});
/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
exports.authRouter.post('/refresh', async (req, res) => {
    try {
        const { error, value } = refreshSchema.validate(req.body);
        if (error) {
            res.status(400).json((0, api_1.createErrorResponse)('VALIDATION_ERROR', 'Refresh token is required'));
            return;
        }
        const { refreshToken } = value;
        // Verify refresh token
        const payload = (0, auth_service_1.verifyToken)(refreshToken);
        if (!payload || payload.type !== 'refresh') {
            res.status(401).json((0, api_1.createErrorResponse)('UNAUTHORIZED', 'Invalid refresh token'));
            return;
        }
        // Find user
        const user = users.get(payload.userId);
        if (!user || !user.isActive) {
            res.status(401).json((0, api_1.createErrorResponse)('UNAUTHORIZED', 'User not found or inactive'));
            return;
        }
        // Generate new tokens
        const tokens = (0, auth_service_1.generateTokenPair)(user);
        logger_1.logger.debug('Token refreshed', { userId: user.id });
        res.json((0, api_1.createSuccessResponse)({
            message: 'Token refreshed',
            ...tokens,
        }));
    }
    catch (err) {
        logger_1.logger.error('Token refresh error:', err);
        res.status(500).json((0, api_1.createErrorResponse)('INTERNAL_ERROR', 'Token refresh failed'));
    }
});
/**
 * GET /api/auth/me
 * Get current user info (requires authentication)
 */
exports.authRouter.get('/me', (req, res) => {
    // This would use authMiddleware in production
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json((0, api_1.createErrorResponse)('UNAUTHORIZED', 'No token provided'));
        return;
    }
    const token = authHeader.substring(7);
    const payload = (0, auth_service_1.verifyToken)(token);
    if (!payload || payload.type !== 'access') {
        res.status(401).json((0, api_1.createErrorResponse)('UNAUTHORIZED', 'Invalid token'));
        return;
    }
    const user = users.get(payload.userId);
    if (!user) {
        res.status(404).json((0, api_1.createErrorResponse)('NOT_FOUND', 'User not found'));
        return;
    }
    res.json((0, api_1.createSuccessResponse)({
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
        },
    }));
});
exports.authRoutesModule = {
    router: exports.authRouter,
};
exports.default = exports.authRoutesModule;
//# sourceMappingURL=auth-routes.js.map