"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = exports.io = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const logger_1 = require("./utils/logger");
const error_handling_1 = require("./utils/error-handling");
const api_1 = require("../shared/types/api");
const connection_1 = require("./database/connection");
const init_1 = require("./database/init");
const queries_1 = require("./database/queries");
const redis_1 = require("./cache/redis");
const cache_manager_1 = require("./cache/cache-manager");
const api_routes_1 = require("./modules/presentation/api-routes");
const citizen_reports_1 = require("./modules/ingestion/citizen-reports");
const auth_routes_1 = require("./modules/auth/auth-routes");
const websocket_handlers_1 = require("./modules/presentation/websocket-handlers");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
    },
});
exports.io = io;
const PORT = process.env.PORT || 5000;
// ============================================================================
// Security and Parsing Middleware
// ============================================================================
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
        },
    },
    crossOriginEmbedderPolicy: false,
}));
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    credentials: true,
}));
app.use((0, morgan_1.default)('combined', { stream: logger_1.httpLogStream }));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// ============================================================================
// Custom Middleware
// ============================================================================
app.use(error_handling_1.requestIdMiddleware);
app.use(error_handling_1.sanitizationMiddleware);
// ============================================================================
// Health Check Routes (no rate limiting)
// ============================================================================
app.get('/health', (_req, res) => {
    res.json((0, api_1.createSuccessResponse)({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'coastal-hazard-intelligence',
        version: '1.0.0',
    }));
});
app.get('/health/detailed', async (_req, res) => {
    const dbHealthy = await queries_1.dbQueries.healthCheck();
    const cacheHealthy = await cache_manager_1.cacheManager.healthCheck();
    const status = dbHealthy && cacheHealthy ? 'ok' : 'degraded';
    const health = {
        status: status,
        timestamp: new Date().toISOString(),
        service: 'coastal-hazard-intelligence',
        version: '1.0.0',
        dependencies: {
            database: dbHealthy ? 'ok' : 'down',
            redis: cacheHealthy ? 'ok' : 'down',
            externalApis: 'ok',
        },
    };
    res.status(status === 'ok' ? 200 : 503).json((0, api_1.createSuccessResponse)(health));
});
// ============================================================================
// API Routes with Rate Limiting
// ============================================================================
app.use('/api', (0, error_handling_1.rateLimitMiddleware)(error_handling_1.apiRateLimiter));
// API info endpoint
app.get('/api', (_req, res) => {
    res.json((0, api_1.createSuccessResponse)({
        message: 'Coastal Hazard Intelligence API',
        version: '1.0.0',
        documentation: '/api/v1/docs',
        health: '/health/detailed',
    }));
});
// ============================================================================
// Modular API Routes
// ============================================================================
// Citizen reports submission endpoint (POST /api/reports/submit)
app.use('/api/reports', citizen_reports_1.citizenReportsRouter);
// Authentication routes (POST /api/auth/register, /api/auth/login, /api/auth/refresh)
app.use('/api/auth', auth_routes_1.authRouter);
// API v1 routes (reports, alerts, dashboard)
app.use('/api/v1', api_routes_1.apiRouter);
// ============================================================================
// WebSocket Setup
// ============================================================================
(0, websocket_handlers_1.initializeWebSocket)(io);
// ============================================================================
// Error Handling
// ============================================================================
app.use(error_handling_1.notFoundMiddleware);
app.use(error_handling_1.errorHandlerMiddleware);
// ============================================================================
// Server Startup
// ============================================================================
async function startServer() {
    try {
        const isDemoMode = process.env.DEMO_MODE === 'true';
        if (isDemoMode) {
            logger_1.logger.info('Starting server in DEMO MODE (no external services required)');
        }
        // Initialize database connection
        await (0, connection_1.connectDatabase)();
        if (!isDemoMode) {
            logger_1.logger.info('Database connected successfully');
            await (0, init_1.initializeDatabase)();
            logger_1.logger.info('Database initialized successfully');
        }
        // Initialize Redis connection
        await (0, redis_1.connectRedis)();
        if (!isDemoMode) {
            logger_1.logger.info('Redis connected successfully');
        }
        server.listen(PORT, () => {
            logger_1.logger.info(`Server running on port ${PORT}`);
            logger_1.logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
            logger_1.logger.info(`Demo Mode: ${isDemoMode ? 'ENABLED' : 'disabled'}`);
            logger_1.logger.info(`Health check: http://localhost:${PORT}/health/detailed`);
            logger_1.logger.info(`API documentation: http://localhost:${PORT}/api/v1/docs`);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
// ============================================================================
// Graceful Shutdown
// ============================================================================
let isShuttingDown = false;
async function gracefulShutdown(signal) {
    if (isShuttingDown) {
        logger_1.logger.info('Shutdown already in progress...');
        return;
    }
    isShuttingDown = true;
    logger_1.logger.info(`${signal} received, starting graceful shutdown...`);
    server.close(async () => {
        logger_1.logger.info('HTTP server closed');
        try {
            // Disconnect WebSocket clients
            (0, websocket_handlers_1.disconnectAllClients)(io);
            // Close database connections
            await (0, connection_1.closeDatabase)();
            logger_1.logger.info('Database connections closed');
            // Close Redis connections
            await (0, redis_1.closeRedis)();
            logger_1.logger.info('Redis connections closed');
            logger_1.logger.info('Graceful shutdown completed');
            process.exit(0);
        }
        catch (error) {
            logger_1.logger.error('Error during graceful shutdown:', error);
            process.exit(1);
        }
    });
    // Force shutdown after timeout
    setTimeout(() => {
        logger_1.logger.error('Forced shutdown due to timeout');
        process.exit(1);
    }, 30000);
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
startServer();
//# sourceMappingURL=index.js.map