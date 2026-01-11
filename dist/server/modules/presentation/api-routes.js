"use strict";
/**
 * API Routes Module
 *
 * Comprehensive REST API endpoints for reports, alerts, and dashboard data.
 * Validates: Requirements 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRoutesModule = exports.apiRouter = void 0;
const express_1 = __importDefault(require("express"));
const logger_1 = require("../../utils/logger");
const queries_1 = require("../../database/queries");
const cache_manager_1 = require("../../cache/cache-manager");
const api_1 = require("../../../shared/types/api");
const report_1 = require("../../../shared/types/report");
const alert_1 = require("../../../shared/types/alert");
// Create router
exports.apiRouter = express_1.default.Router();
// Middleware for request logging
exports.apiRouter.use((req, _res, next) => {
    logger_1.logger.debug(`API Request: ${req.method} ${req.path}`, {
        query: req.query,
        body: req.method !== 'GET' ? req.body : undefined,
    });
    next();
});
// ============================================================================
// API Documentation Endpoint
// ============================================================================
exports.apiRouter.get('/docs', (_req, res) => {
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
    res.json((0, api_1.createSuccessResponse)(documentation));
});
// ============================================================================
// Health Check Endpoint
// ============================================================================
exports.apiRouter.get('/health', async (_req, res) => {
    try {
        const dbHealthy = await queries_1.dbQueries.healthCheck();
        const cacheHealthy = await cache_manager_1.cacheManager.healthCheck();
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
    }
    catch (error) {
        logger_1.logger.error('Health check failed:', error);
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
exports.apiRouter.get('/reports', async (req, res) => {
    try {
        const params = {
            page: parseInt(req.query.page) || 1,
            limit: Math.min(parseInt(req.query.limit) || 20, 100),
            sortBy: req.query.sortBy || 'timestamp',
            sortOrder: req.query.sortOrder || 'desc',
        };
        const validationErrors = (0, api_1.validatePaginationParams)(params);
        if (validationErrors.length > 0) {
            res.status(400).json((0, api_1.createErrorResponse)('VALIDATION_ERROR', 'Validation failed', validationErrors.join(', ')));
            return;
        }
        // Build filters
        const filters = {};
        if (req.query.status && (0, report_1.isValidReportStatus)(req.query.status)) {
            filters.status = req.query.status;
        }
        if (req.query.hazardType && (0, report_1.isValidHazardType)(req.query.hazardType)) {
            filters.hazardType = req.query.hazardType;
        }
        if (req.query.severity && (0, report_1.isValidSeverityLevel)(req.query.severity)) {
            filters.severity = req.query.severity;
        }
        if (req.query.region) {
            filters.region = req.query.region;
        }
        if (req.query.startDate) {
            filters.startDate = new Date(req.query.startDate);
        }
        if (req.query.endDate) {
            filters.endDate = new Date(req.query.endDate);
        }
        const { reports, total } = await queries_1.dbQueries.getReportsPaginated(params.page, params.limit, filters);
        const response = {
            items: reports,
            pagination: {
                page: params.page,
                limit: params.limit,
                total,
                totalPages: Math.ceil(total / params.limit),
                hasNext: params.page * params.limit < total,
                hasPrev: params.page > 1,
            },
        };
        res.json((0, api_1.createSuccessResponse)(response));
    }
    catch (error) {
        logger_1.logger.error('Error fetching reports:', error);
        res.status(500).json((0, api_1.createErrorResponse)('INTERNAL_ERROR', 'Failed to fetch reports'));
    }
});
// Get reports by location (must be before :id route)
exports.apiRouter.get('/reports/location', async (req, res) => {
    try {
        const latitude = parseFloat(req.query.latitude);
        const longitude = parseFloat(req.query.longitude);
        const radius = parseFloat(req.query.radius) || 5;
        if (isNaN(latitude) || latitude < -90 || latitude > 90) {
            res.status(400).json((0, api_1.createErrorResponse)('VALIDATION_ERROR', 'Invalid latitude', 'Latitude must be between -90 and 90'));
            return;
        }
        if (isNaN(longitude) || longitude < -180 || longitude > 180) {
            res.status(400).json((0, api_1.createErrorResponse)('VALIDATION_ERROR', 'Invalid longitude', 'Longitude must be between -180 and 180'));
            return;
        }
        if (radius <= 0 || radius > 100) {
            res.status(400).json((0, api_1.createErrorResponse)('VALIDATION_ERROR', 'Invalid radius', 'Radius must be between 0 and 100 km'));
            return;
        }
        const reports = await queries_1.dbQueries.getReportsByLocation(latitude, longitude, radius);
        res.json((0, api_1.createSuccessResponse)({ reports, count: reports.length }));
    }
    catch (error) {
        logger_1.logger.error('Error fetching reports by location:', error);
        res.status(500).json((0, api_1.createErrorResponse)('INTERNAL_ERROR', 'Failed to fetch reports'));
    }
});
// Get report by ID
exports.apiRouter.get('/reports/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json((0, api_1.createErrorResponse)('VALIDATION_ERROR', 'Report ID is required'));
            return;
        }
        // Try cache first
        let report = await cache_manager_1.cacheManager.getReport(id);
        if (!report) {
            report = await queries_1.dbQueries.getReportById(id);
            if (report) {
                await cache_manager_1.cacheManager.cacheReport(report);
            }
        }
        if (!report) {
            res.status(404).json((0, api_1.createErrorResponse)('NOT_FOUND', 'Report not found'));
            return;
        }
        res.json((0, api_1.createSuccessResponse)(report));
    }
    catch (error) {
        logger_1.logger.error('Error fetching report:', error);
        res.status(500).json((0, api_1.createErrorResponse)('INTERNAL_ERROR', 'Failed to fetch report'));
    }
});
// ============================================================================
// Alerts Endpoints
// ============================================================================
// Get paginated alerts with filtering
exports.apiRouter.get('/alerts', async (req, res) => {
    try {
        const minConfidenceValue = req.query.minConfidence ? parseFloat(req.query.minConfidence) : undefined;
        const params = {
            page: parseInt(req.query.page) || 1,
            limit: Math.min(parseInt(req.query.limit) || 20, 100),
            sortBy: req.query.sortBy || 'timestamp',
            sortOrder: req.query.sortOrder || 'desc',
            status: req.query.status,
            hazardType: req.query.hazardType,
            severity: req.query.severity,
            region: req.query.region,
            minConfidence: minConfidenceValue,
        };
        // Validate filters
        if (params.status && !(0, alert_1.isValidAlertStatus)(params.status)) {
            res.status(400).json((0, api_1.createErrorResponse)('VALIDATION_ERROR', 'Invalid status', 'Status must be: active, verified, resolved, or false_alarm'));
            return;
        }
        if (params.hazardType && !(0, report_1.isValidHazardType)(params.hazardType)) {
            res.status(400).json((0, api_1.createErrorResponse)('VALIDATION_ERROR', 'Invalid hazard type'));
            return;
        }
        if (params.severity && !(0, report_1.isValidSeverityLevel)(params.severity)) {
            res.status(400).json((0, api_1.createErrorResponse)('VALIDATION_ERROR', 'Invalid severity', 'Severity must be: low, moderate, or high'));
            return;
        }
        const { alerts, total } = await queries_1.dbQueries.getAlertsPaginated(params.page, params.limit, {
            status: params.status,
            hazardType: params.hazardType,
            severity: params.severity,
            region: params.region,
            minConfidence: params.minConfidence,
        });
        const response = {
            items: alerts,
            pagination: {
                page: params.page,
                limit: params.limit,
                total,
                totalPages: Math.ceil(total / params.limit),
                hasNext: params.page * params.limit < total,
                hasPrev: params.page > 1,
            },
        };
        res.json((0, api_1.createSuccessResponse)(response));
    }
    catch (error) {
        logger_1.logger.error('Error fetching alerts:', error);
        res.status(500).json((0, api_1.createErrorResponse)('INTERNAL_ERROR', 'Failed to fetch alerts'));
    }
});
// Get active alerts
exports.apiRouter.get('/alerts/active', async (_req, res) => {
    try {
        let alerts = await cache_manager_1.cacheManager.getActiveAlerts();
        if (!alerts) {
            alerts = await queries_1.dbQueries.getActiveAlerts();
            await cache_manager_1.cacheManager.cacheActiveAlerts(alerts);
        }
        // Sort by priority
        alerts.sort((a, b) => (0, alert_1.calculateAlertPriority)(b) - (0, alert_1.calculateAlertPriority)(a));
        res.json((0, api_1.createSuccessResponse)({
            alerts,
            count: alerts.length,
        }));
    }
    catch (error) {
        logger_1.logger.error('Error fetching active alerts:', error);
        res.status(500).json((0, api_1.createErrorResponse)('INTERNAL_ERROR', 'Failed to fetch active alerts'));
    }
});
// Get alert by ID
exports.apiRouter.get('/alerts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json((0, api_1.createErrorResponse)('VALIDATION_ERROR', 'Alert ID is required'));
            return;
        }
        // Try cache first
        let alert = await cache_manager_1.cacheManager.getAlert(id);
        if (!alert) {
            alert = await queries_1.dbQueries.getAlertById(id);
            if (alert) {
                await cache_manager_1.cacheManager.cacheAlert(alert);
            }
        }
        if (!alert) {
            res.status(404).json((0, api_1.createErrorResponse)('NOT_FOUND', 'Alert not found'));
            return;
        }
        res.json((0, api_1.createSuccessResponse)(alert));
    }
    catch (error) {
        logger_1.logger.error('Error fetching alert:', error);
        res.status(500).json((0, api_1.createErrorResponse)('INTERNAL_ERROR', 'Failed to fetch alert'));
    }
});
// Verify alert
exports.apiRouter.post('/alerts/:id/verify', async (req, res) => {
    try {
        const { id } = req.params;
        const { action, notes, performedBy } = req.body;
        if (!id || !action || !performedBy) {
            res.status(400).json((0, api_1.createErrorResponse)('VALIDATION_ERROR', 'Alert ID, action, and performedBy are required'));
            return;
        }
        if (!['confirm', 'dispute', 'resolve', 'flag_false_alarm'].includes(action)) {
            res.status(400).json((0, api_1.createErrorResponse)('VALIDATION_ERROR', 'Invalid action', 'Action must be: confirm, dispute, resolve, or flag_false_alarm'));
            return;
        }
        const alert = await queries_1.dbQueries.getAlertById(id);
        if (!alert) {
            res.status(404).json((0, api_1.createErrorResponse)('NOT_FOUND', 'Alert not found'));
            return;
        }
        // Map action to new status
        const statusMap = {
            confirm: 'verified',
            dispute: 'false_alarm',
            resolve: 'resolved',
            flag_false_alarm: 'false_alarm',
        };
        const newStatus = statusMap[action];
        const updatedAlert = await queries_1.dbQueries.updateAlertStatus(id, newStatus);
        // Invalidate cache
        await cache_manager_1.cacheManager.invalidateAlert(id);
        await cache_manager_1.cacheManager.invalidateDashboardData();
        logger_1.logger.info('Alert verified', {
            alertId: id,
            action,
            newStatus,
            performedBy,
            notes,
        });
        res.json((0, api_1.createSuccessResponse)({
            message: 'Alert verification recorded',
            alertId: id,
            previousStatus: alert.status,
            newStatus,
            action,
        }));
    }
    catch (error) {
        logger_1.logger.error('Error verifying alert:', error);
        res.status(500).json((0, api_1.createErrorResponse)('INTERNAL_ERROR', 'Failed to verify alert'));
    }
});
// ============================================================================
// Dashboard Endpoints
// ============================================================================
// Get dashboard data
exports.apiRouter.get('/dashboard', async (_req, res) => {
    try {
        let dashboardData = await cache_manager_1.cacheManager.getDashboardData();
        if (!dashboardData) {
            const [alerts, reports, stats] = await Promise.all([
                queries_1.dbQueries.getActiveAlerts(),
                queries_1.dbQueries.getRecentReports(20),
                queries_1.dbQueries.getSystemStats(),
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
            await cache_manager_1.cacheManager.cacheDashboardData(dashboardData);
        }
        res.json((0, api_1.createSuccessResponse)(dashboardData));
    }
    catch (error) {
        logger_1.logger.error('Error fetching dashboard data:', error);
        res.status(500).json((0, api_1.createErrorResponse)('INTERNAL_ERROR', 'Failed to fetch dashboard data'));
    }
});
// Get system statistics
exports.apiRouter.get('/dashboard/stats', async (req, res) => {
    try {
        // Support time-based filtering
        const timeRange = req.query.timeRange || '7d';
        let stats = await cache_manager_1.cacheManager.getSystemStats();
        if (!stats) {
            stats = await queries_1.dbQueries.getSystemStats();
            await cache_manager_1.cacheManager.cacheSystemStats(stats);
        }
        res.json((0, api_1.createSuccessResponse)({
            ...stats,
            timeRange,
            averageResponseTime: 45,
            lastUpdated: new Date().toISOString(),
        }));
    }
    catch (error) {
        logger_1.logger.error('Error fetching system stats:', error);
        res.status(500).json((0, api_1.createErrorResponse)('INTERNAL_ERROR', 'Failed to fetch system statistics'));
    }
});
// Get map data
exports.apiRouter.get('/dashboard/map', async (_req, res) => {
    try {
        const [alerts, reports] = await Promise.all([
            queries_1.dbQueries.getActiveAlerts(),
            queries_1.dbQueries.getRecentReports(100),
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
        res.json((0, api_1.createSuccessResponse)(mapData));
    }
    catch (error) {
        logger_1.logger.error('Error fetching map data:', error);
        res.status(500).json((0, api_1.createErrorResponse)('INTERNAL_ERROR', 'Failed to fetch map data'));
    }
});
// ============================================================================
// Error Handling
// ============================================================================
// 404 handler for API routes
exports.apiRouter.use((_req, res) => {
    res.status(404).json((0, api_1.createErrorResponse)('NOT_FOUND', 'The requested API endpoint does not exist'));
});
// Error handler
exports.apiRouter.use((err, _req, res, _next) => {
    logger_1.logger.error('API Error:', err);
    res.status(500).json((0, api_1.createErrorResponse)('INTERNAL_ERROR', err.message));
});
exports.apiRoutesModule = {
    router: exports.apiRouter,
};
exports.default = exports.apiRoutesModule;
//# sourceMappingURL=api-routes.js.map