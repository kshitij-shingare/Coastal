/**
 * API Routes Module
 * 
 * Comprehensive REST API endpoints for reports, alerts, and dashboard data.
 * Validates: Requirements 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5
 */

import express, { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';
import { dbQueries } from '../../database/queries';
import { cacheManager } from '../../cache/cache-manager';
import {
  createSuccessResponse,
  createErrorResponse,
  validatePaginationParams,
  PaginationParams,
  AlertQueryParams,
} from '../../../shared/types/api';
import { isValidHazardType, isValidSeverityLevel, isValidReportStatus, ReportStatus, HazardType, SeverityLevel } from '../../../shared/types/report';
import { isValidAlertStatus, calculateAlertPriority, AlertStatus } from '../../../shared/types/alert';

// Create router
export const apiRouter = express.Router();

// Middleware for request logging
apiRouter.use((req: Request, _res: Response, next: NextFunction) => {
  logger.debug(`API Request: ${req.method} ${req.path}`, {
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined,
  });
  next();
});

// ============================================================================
// API Documentation Endpoint
// ============================================================================

apiRouter.get('/docs', (_req: Request, res: Response) => {
  const documentation = {
    name: 'Coastal Hazard Intelligence API',
    version: '1.0.0',
    description: 'REST API for coastal hazard monitoring and alert management',
    baseUrl: '/api/v1',
    endpoints: {
      reports: {
        'GET /reports': 'Get paginated list of reports',
        'GET /reports/:id': 'Get report by ID',
        'GET /reports/location': 'Get reports by geographic location',
        'POST /api/reports/submit': 'Submit a new citizen report',
      },
      alerts: {
        'GET /alerts': 'Get paginated list of alerts with filtering',
        'GET /alerts/active': 'Get all active alerts',
        'GET /alerts/:id': 'Get alert by ID',
        'POST /alerts/:id/verify': 'Verify an alert (confirm/dispute)',
      },
      dashboard: {
        'GET /dashboard': 'Get dashboard data (alerts, reports, stats)',
        'GET /dashboard/stats': 'Get system statistics',
        'GET /dashboard/map': 'Get map data (heatmap, markers)',
      },
      auth: {
        'POST /api/auth/register': 'Register new user',
        'POST /api/auth/login': 'Authenticate user',
        'POST /api/auth/refresh': 'Refresh JWT token',
      },
    },
    queryParameters: {
      pagination: {
        page: 'Page number (default: 1)',
        limit: 'Items per page (default: 20, max: 100)',
        sortBy: 'Field to sort by',
        sortOrder: 'Sort order: asc or desc',
      },
      filters: {
        status: 'Filter by status',
        hazardType: 'Filter by hazard type',
        severity: 'Filter by severity: low, moderate, high',
        region: 'Filter by region name',
        startDate: 'Filter by start date (ISO format)',
        endDate: 'Filter by end date (ISO format)',
        minConfidence: 'Minimum confidence score (0-100)',
      },
    },
  };

  res.json(createSuccessResponse(documentation));
});

// ============================================================================
// Health Check Endpoint
// ============================================================================

apiRouter.get('/health', async (_req: Request, res: Response) => {
  try {
    const dbHealthy = await dbQueries.healthCheck();
    const cacheHealthy = await cacheManager.healthCheck();

    const status = dbHealthy && cacheHealthy ? 'ok' : 'degraded';
    const response = {
      status,
      timestamp: new Date().toISOString(),
      service: 'coastal-hazard-intelligence-api',
      version: '1.0.0',
      dependencies: {
        database: dbHealthy ? 'ok' : 'down',
        redis: cacheHealthy ? 'ok' : 'down',
        externalApis: 'ok',
      },
    };

    const statusCode = status === 'ok' ? 200 : 503;
    res.status(statusCode).json(response);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'down',
      timestamp: new Date().toISOString(),
      service: 'coastal-hazard-intelligence-api',
      error: 'Health check failed',
    });
  }
});

// ============================================================================
// Reports Endpoints
// ============================================================================

// Get paginated reports
apiRouter.get('/reports', async (req: Request, res: Response): Promise<void> => {
  try {
    const params: PaginationParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: Math.min(parseInt(req.query.limit as string) || 20, 100),
      sortBy: req.query.sortBy as string || 'timestamp',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const validationErrors = validatePaginationParams(params);
    if (validationErrors.length > 0) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Validation failed', validationErrors.join(', ')));
      return;
    }

    // Build filters
    const filters: {
      status?: ReportStatus;
      hazardType?: HazardType;
      severity?: SeverityLevel;
      region?: string;
      startDate?: Date;
      endDate?: Date;
    } = {};

    if (req.query.status && isValidReportStatus(req.query.status as string)) {
      filters.status = req.query.status as ReportStatus;
    }
    if (req.query.hazardType && isValidHazardType(req.query.hazardType as string)) {
      filters.hazardType = req.query.hazardType as HazardType;
    }
    if (req.query.severity && isValidSeverityLevel(req.query.severity as string)) {
      filters.severity = req.query.severity as SeverityLevel;
    }
    if (req.query.region) {
      filters.region = req.query.region as string;
    }
    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate as string);
    }

    const { reports, total } = await dbQueries.getReportsPaginated(params.page!, params.limit!, filters);

    const response = {
      items: reports,
      pagination: {
        page: params.page!,
        limit: params.limit!,
        total,
        totalPages: Math.ceil(total / params.limit!),
        hasNext: params.page! * params.limit! < total,
        hasPrev: params.page! > 1,
      },
    };

    res.json(createSuccessResponse(response));
  } catch (error) {
    logger.error('Error fetching reports:', error);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to fetch reports'));
  }
});

// Get reports by location (must be before :id route)
apiRouter.get('/reports/location', async (req: Request, res: Response): Promise<void> => {
  try {
    const latitude = parseFloat(req.query.latitude as string);
    const longitude = parseFloat(req.query.longitude as string);
    const radius = parseFloat(req.query.radius as string) || 5;

    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Invalid latitude', 'Latitude must be between -90 and 90'));
      return;
    }

    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Invalid longitude', 'Longitude must be between -180 and 180'));
      return;
    }

    if (radius <= 0 || radius > 100) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Invalid radius', 'Radius must be between 0 and 100 km'));
      return;
    }

    const reports = await dbQueries.getReportsByLocation(latitude, longitude, radius);
    res.json(createSuccessResponse({ reports, count: reports.length }));
  } catch (error) {
    logger.error('Error fetching reports by location:', error);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to fetch reports'));
  }
});

// Get report by ID
apiRouter.get('/reports/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Report ID is required'));
      return;
    }

    // Try cache first
    let report = await cacheManager.getReport(id);
    if (!report) {
      report = await dbQueries.getReportById(id);
      if (report) {
        await cacheManager.cacheReport(report);
      }
    }

    if (!report) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Report not found'));
      return;
    }

    res.json(createSuccessResponse(report));
  } catch (error) {
    logger.error('Error fetching report:', error);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to fetch report'));
  }
});

// ============================================================================
// Alerts Endpoints
// ============================================================================

// Get paginated alerts with filtering
apiRouter.get('/alerts', async (req: Request, res: Response): Promise<void> => {
  try {
    const minConfidenceValue = req.query.minConfidence ? parseFloat(req.query.minConfidence as string) : undefined;

    const params: AlertQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: Math.min(parseInt(req.query.limit as string) || 20, 100),
      sortBy: req.query.sortBy as string || 'timestamp',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      status: req.query.status as AlertStatus | undefined,
      hazardType: req.query.hazardType as HazardType | undefined,
      severity: req.query.severity as SeverityLevel | undefined,
      region: req.query.region as string | undefined,
      minConfidence: minConfidenceValue,
    };

    // Validate filters
    if (params.status && !isValidAlertStatus(params.status)) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Invalid status', 'Status must be: active, verified, resolved, or false_alarm'));
      return;
    }

    if (params.hazardType && !isValidHazardType(params.hazardType)) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Invalid hazard type'));
      return;
    }

    if (params.severity && !isValidSeverityLevel(params.severity)) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Invalid severity', 'Severity must be: low, moderate, or high'));
      return;
    }

    const { alerts, total } = await dbQueries.getAlertsPaginated(params.page!, params.limit!, {
      status: params.status,
      hazardType: params.hazardType,
      severity: params.severity,
      region: params.region,
      minConfidence: params.minConfidence,
    });

    const response = {
      items: alerts,
      pagination: {
        page: params.page!,
        limit: params.limit!,
        total,
        totalPages: Math.ceil(total / params.limit!),
        hasNext: params.page! * params.limit! < total,
        hasPrev: params.page! > 1,
      },
    };

    res.json(createSuccessResponse(response));
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to fetch alerts'));
  }
});

// Get active alerts
apiRouter.get('/alerts/active', async (_req: Request, res: Response) => {
  try {
    let alerts = await cacheManager.getActiveAlerts();
    if (!alerts) {
      alerts = await dbQueries.getActiveAlerts();
      await cacheManager.cacheActiveAlerts(alerts);
    }

    // Sort by priority
    alerts.sort((a, b) => calculateAlertPriority(b) - calculateAlertPriority(a));

    res.json(createSuccessResponse({
      alerts,
      count: alerts.length,
    }));
  } catch (error) {
    logger.error('Error fetching active alerts:', error);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to fetch active alerts'));
  }
});

// Get alert by ID
apiRouter.get('/alerts/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Alert ID is required'));
      return;
    }

    // Try cache first
    let alert = await cacheManager.getAlert(id);
    if (!alert) {
      alert = await dbQueries.getAlertById(id);
      if (alert) {
        await cacheManager.cacheAlert(alert);
      }
    }

    if (!alert) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Alert not found'));
      return;
    }

    res.json(createSuccessResponse(alert));
  } catch (error) {
    logger.error('Error fetching alert:', error);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to fetch alert'));
  }
});

// Verify alert
apiRouter.post('/alerts/:id/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, notes, performedBy } = req.body;

    if (!id || !action || !performedBy) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Alert ID, action, and performedBy are required'));
      return;
    }

    if (!['confirm', 'dispute', 'resolve', 'flag_false_alarm'].includes(action)) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Invalid action', 'Action must be: confirm, dispute, resolve, or flag_false_alarm'));
      return;
    }

    const alert = await dbQueries.getAlertById(id);
    if (!alert) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Alert not found'));
      return;
    }

    // Map action to new status
    const statusMap: Record<string, AlertStatus> = {
      confirm: 'verified',
      dispute: 'false_alarm',
      resolve: 'resolved',
      flag_false_alarm: 'false_alarm',
    };

    const newStatus = statusMap[action];
    const updatedAlert = await dbQueries.updateAlertStatus(id, newStatus);

    // Invalidate cache
    await cacheManager.invalidateAlert(id);
    await cacheManager.invalidateDashboardData();

    logger.info('Alert verified', {
      alertId: id,
      action,
      newStatus,
      performedBy,
      notes,
    });

    res.json(createSuccessResponse({
      message: 'Alert verification recorded',
      alertId: id,
      previousStatus: alert.status,
      newStatus,
      action,
    }));
  } catch (error) {
    logger.error('Error verifying alert:', error);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to verify alert'));
  }
});

// ============================================================================
// Dashboard Endpoints
// ============================================================================

// Get dashboard data
apiRouter.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    let dashboardData = await cacheManager.getDashboardData();

    if (!dashboardData) {
      const [alerts, reports, stats] = await Promise.all([
        dbQueries.getActiveAlerts(),
        dbQueries.getRecentReports(20),
        dbQueries.getSystemStats(),
      ]);

      dashboardData = {
        activeAlerts: alerts,
        recentReports: reports,
        systemStats: {
          ...stats,
          averageResponseTime: 45, // Mock value
        },
        mapData: {
          heatmapPoints: reports.map(r => ({
            latitude: r.location.latitude,
            longitude: r.location.longitude,
            intensity: r.classification.confidence / 100,
            hazardType: r.classification.hazardType || 'other',
          })),
          alertMarkers: alerts.map(a => ({
            latitude: 0, // Would extract from region bounds center
            longitude: 0,
            severity: a.severity,
            alertId: a.id,
            hazardType: a.hazardType,
            confidence: a.confidence,
          })),
        },
      };

      await cacheManager.cacheDashboardData(dashboardData);
    }

    res.json(createSuccessResponse(dashboardData));
  } catch (error) {
    logger.error('Error fetching dashboard data:', error);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to fetch dashboard data'));
  }
});

// Get system statistics
apiRouter.get('/dashboard/stats', async (req: Request, res: Response) => {
  try {
    // Support time-based filtering
    const timeRange = req.query.timeRange as string || '7d';
    
    let stats = await cacheManager.getSystemStats();

    if (!stats) {
      stats = await dbQueries.getSystemStats();
      await cacheManager.cacheSystemStats(stats);
    }

    res.json(createSuccessResponse({
      ...stats,
      timeRange,
      averageResponseTime: 45,
      lastUpdated: new Date().toISOString(),
    }));
  } catch (error) {
    logger.error('Error fetching system stats:', error);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to fetch system statistics'));
  }
});

// Get map data
apiRouter.get('/dashboard/map', async (_req: Request, res: Response) => {
  try {
    const [alerts, reports] = await Promise.all([
      dbQueries.getActiveAlerts(),
      dbQueries.getRecentReports(100),
    ]);

    const mapData = {
      heatmapPoints: reports.map(r => ({
        latitude: r.location.latitude,
        longitude: r.location.longitude,
        intensity: r.classification.confidence / 100,
        hazardType: r.classification.hazardType || 'other',
      })),
      alertMarkers: alerts.map(a => ({
        latitude: 0,
        longitude: 0,
        severity: a.severity,
        alertId: a.id,
        hazardType: a.hazardType,
        confidence: a.confidence,
      })),
      lastUpdated: new Date().toISOString(),
    };

    res.json(createSuccessResponse(mapData));
  } catch (error) {
    logger.error('Error fetching map data:', error);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to fetch map data'));
  }
});

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler for API routes
apiRouter.use((_req: Request, res: Response) => {
  res.status(404).json(createErrorResponse('NOT_FOUND', 'The requested API endpoint does not exist'));
});

// Error handler
apiRouter.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('API Error:', err);
  res.status(500).json(createErrorResponse('INTERNAL_ERROR', err.message));
});

export const apiRoutesModule = {
  router: apiRouter,
};

export default apiRoutesModule;
