import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { logger, httpLogStream } from './utils/logger';
import {
  requestIdMiddleware,
  sanitizationMiddleware,
  rateLimitMiddleware,
  errorHandlerMiddleware,
  notFoundMiddleware,
  apiRateLimiter,
} from './utils/error-handling';
import { createSuccessResponse } from '../shared/types/api';
import { connectDatabase, closeDatabase } from './database/connection';
import { initializeDatabase } from './database/init';
import { dbQueries } from './database/queries';
import { connectRedis, closeRedis } from './cache/redis';
import { cacheManager } from './cache/cache-manager';
import { apiRouter } from './modules/presentation/api-routes';
import { citizenReportsRouter } from './modules/ingestion/citizen-reports';
import { authRouter } from './modules/auth/auth-routes';
import { initializeWebSocket, disconnectAllClients } from './modules/presentation/websocket-handlers';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 5000;

// ============================================================================
// Security and Parsing Middleware
// ============================================================================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    credentials: true,
  })
);

app.use(morgan('combined', { stream: httpLogStream }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============================================================================
// Custom Middleware
// ============================================================================
app.use(requestIdMiddleware);
app.use(sanitizationMiddleware);

// ============================================================================
// Health Check Routes (no rate limiting)
// ============================================================================
app.get('/health', (_req, res) => {
  res.json(
    createSuccessResponse({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'coastal-hazard-intelligence',
      version: '1.0.0',
    })
  );
});

app.get('/health/detailed', async (_req, res) => {
  const dbHealthy = await dbQueries.healthCheck();
  const cacheHealthy = await cacheManager.healthCheck();
  
  const status = dbHealthy && cacheHealthy ? 'ok' : 'degraded';
  const health = {
    status: status as 'ok' | 'degraded',
    timestamp: new Date().toISOString(),
    service: 'coastal-hazard-intelligence',
    version: '1.0.0',
    dependencies: {
      database: dbHealthy ? 'ok' as const : 'down' as const,
      redis: cacheHealthy ? 'ok' as const : 'down' as const,
      externalApis: 'ok' as const,
    },
  };

  res.status(status === 'ok' ? 200 : 503).json(createSuccessResponse(health));
});

// ============================================================================
// API Routes with Rate Limiting
// ============================================================================
app.use('/api', rateLimitMiddleware(apiRateLimiter));

// API info endpoint
app.get('/api', (_req, res) => {
  res.json(
    createSuccessResponse({
      message: 'Coastal Hazard Intelligence API',
      version: '1.0.0',
      documentation: '/api/v1/docs',
      health: '/health/detailed',
    })
  );
});

// ============================================================================
// Modular API Routes
// ============================================================================

// Citizen reports submission endpoint (POST /api/reports/submit)
app.use('/api/reports', citizenReportsRouter);

// Authentication routes (POST /api/auth/register, /api/auth/login, /api/auth/refresh)
app.use('/api/auth', authRouter);

// API v1 routes (reports, alerts, dashboard)
app.use('/api/v1', apiRouter);

// ============================================================================
// WebSocket Setup
// ============================================================================
initializeWebSocket(io);

// Export io for use in other modules
export { io };

// ============================================================================
// Error Handling
// ============================================================================
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

// ============================================================================
// Server Startup
// ============================================================================
async function startServer() {
  try {
    const isDemoMode = process.env.DEMO_MODE === 'true';

    if (isDemoMode) {
      logger.info('Starting server in DEMO MODE (no external services required)');
    }

    // Initialize database connection
    await connectDatabase();
    if (!isDemoMode) {
      logger.info('Database connected successfully');
      await initializeDatabase();
      logger.info('Database initialized successfully');
    }

    // Initialize Redis connection
    await connectRedis();
    if (!isDemoMode) {
      logger.info('Redis connected successfully');
    }

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Demo Mode: ${isDemoMode ? 'ENABLED' : 'disabled'}`);
      logger.info(`Health check: http://localhost:${PORT}/health/detailed`);
      logger.info(`API documentation: http://localhost:${PORT}/api/v1/docs`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// ============================================================================
// Graceful Shutdown
// ============================================================================
let isShuttingDown = false;

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) {
    logger.info('Shutdown already in progress...');
    return;
  }

  isShuttingDown = true;
  logger.info(`${signal} received, starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Disconnect WebSocket clients
      disconnectAllClients(io);
      
      // Close database connections
      await closeDatabase();
      logger.info('Database connections closed');

      // Close Redis connections
      await closeRedis();
      logger.info('Redis connections closed');

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after timeout
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();

export { app };
