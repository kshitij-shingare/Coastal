"use strict";
/**
 * Citizen Reports Ingestion Module
 *
 * Handles submission and validation of citizen hazard reports.
 * Validates: Requirements 4.1, 4.5
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.citizenReportsModule = exports.citizenReportsRouter = void 0;
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const joi_1 = __importDefault(require("joi"));
const uuid_1 = require("uuid");
const logger_1 = require("../../utils/logger");
const queries_1 = require("../../database/queries");
const cache_manager_1 = require("../../cache/cache-manager");
const api_1 = require("../../../shared/types/api");
const error_handling_1 = require("../../utils/error-handling");
// Create router
exports.citizenReportsRouter = express_1.default.Router();
// Configure multer for file uploads
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10); // 10MB default
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${(0, uuid_1.v4)()}`;
        cb(null, `${uniqueSuffix}${path_1.default.extname(file.originalname)}`);
    },
});
const fileFilter = (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(`File type ${file.mimetype} not allowed`));
    }
};
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: maxFileSize,
        files: 5, // Max 5 files per upload
    },
    fileFilter,
});
// Validation schema for report submission
const reportSubmissionSchema = joi_1.default.object({
    description: joi_1.default.string().min(10).max(5000).required().messages({
        'string.min': 'Description must be at least 10 characters',
        'string.max': 'Description must not exceed 5000 characters',
        'any.required': 'Description is required',
    }),
    latitude: joi_1.default.number().min(-90).max(90).required().messages({
        'number.min': 'Latitude must be between -90 and 90',
        'number.max': 'Latitude must be between -90 and 90',
        'any.required': 'Latitude is required',
    }),
    longitude: joi_1.default.number().min(-180).max(180).required().messages({
        'number.min': 'Longitude must be between -180 and 180',
        'number.max': 'Longitude must be between -180 and 180',
        'any.required': 'Longitude is required',
    }),
    address: joi_1.default.string().max(500).optional(),
    hazardType: joi_1.default.string().valid('flooding', 'storm_surge', 'high_waves', 'erosion', 'rip_current', 'tsunami', 'pollution', 'other').optional(),
    severity: joi_1.default.string().valid('low', 'moderate', 'high').optional(),
    language: joi_1.default.string().max(10).default('en'),
});
// Helper to determine region from coordinates
function getRegionFromCoordinates(lat, lng) {
    // India coastal regions mapping (simplified)
    if (lat > 20 && lng < 74)
        return 'Gujarat Coast';
    if (lat > 15 && lat <= 20 && lng < 74)
        return 'Maharashtra Coast';
    if (lat > 12 && lat <= 15 && lng < 76)
        return 'Karnataka Coast';
    if (lat > 8 && lat <= 12 && lng < 77)
        return 'Kerala Coast';
    if (lat > 8 && lat <= 13 && lng >= 77 && lng < 80)
        return 'Tamil Nadu Coast';
    if (lat > 13 && lat <= 16 && lng >= 80)
        return 'Andhra Pradesh Coast';
    if (lat > 16 && lat <= 22 && lng >= 82)
        return 'Odisha Coast';
    if (lat > 21 && lng >= 87)
        return 'West Bengal Coast';
    return 'Unknown Region';
}
// Apply rate limiting to report submission
exports.citizenReportsRouter.use('/submit', (0, error_handling_1.rateLimitMiddleware)(error_handling_1.reportSubmitRateLimiter));
/**
 * POST /api/reports/submit
 * Submit a new citizen report
 */
exports.citizenReportsRouter.post('/submit', upload.array('media', 5), async (req, res, next) => {
    try {
        // Validate request body
        const { error, value } = reportSubmissionSchema.validate(req.body, { abortEarly: false });
        if (error) {
            const errorMessages = error.details.map(d => d.message).join(', ');
            res.status(400).json((0, api_1.createErrorResponse)('VALIDATION_ERROR', 'Validation failed', errorMessages));
            return;
        }
        const { description, latitude, longitude, address, hazardType, severity, language } = value;
        // Get uploaded files
        const files = req.files;
        const mediaFiles = files?.map(file => ({
            id: (0, uuid_1.v4)(),
            fileName: file.originalname,
            filePath: file.path,
            fileType: file.mimetype.split('/')[0], // 'image' or 'video'
            fileSize: file.size,
            mimeType: file.mimetype,
            createdAt: new Date(),
        }));
        // Create report object
        const report = {
            timestamp: new Date(),
            location: {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                address: address || undefined,
            },
            source: 'citizen',
            content: {
                originalText: description,
                language: language || 'en',
                mediaFiles: mediaFiles,
            },
            classification: {
                hazardType: hazardType,
                severity: severity,
                confidence: 0, // Will be set by AI processing
            },
            status: 'pending',
            region: getRegionFromCoordinates(parseFloat(latitude), parseFloat(longitude)),
            metadata: {
                deviceInfo: req.headers['user-agent'] || undefined,
                ipAddress: req.ip || undefined,
                userAgent: req.headers['user-agent'] || undefined,
            },
        };
        // Save to database
        const savedReport = await queries_1.dbQueries.createReport(report);
        // Invalidate cache
        await cache_manager_1.cacheManager.invalidateRecentReports();
        await cache_manager_1.cacheManager.invalidateDashboardData();
        await cache_manager_1.cacheManager.invalidateSystemStats();
        logger_1.logger.info('New citizen report submitted', {
            reportId: savedReport.id,
            region: savedReport.region,
            hazardType: savedReport.classification.hazardType,
            hasMedia: (mediaFiles?.length || 0) > 0,
        });
        // TODO: Trigger AI processing asynchronously
        // This will be implemented in the AI Processing module
        res.status(201).json((0, api_1.createSuccessResponse)({
            message: 'Report submitted successfully',
            reportId: savedReport.id,
            status: savedReport.status,
            region: savedReport.region,
            timestamp: savedReport.timestamp,
        }));
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/reports/my-reports
 * Get reports submitted by the current user (placeholder for auth)
 */
exports.citizenReportsRouter.get('/my-reports', async (req, res) => {
    // TODO: Implement user authentication and filter by user ID
    res.json((0, api_1.createSuccessResponse)({
        reports: [],
        message: 'Authentication required to view your reports',
    }));
});
/**
 * GET /api/reports/:id/status
 * Get the status of a specific report
 */
exports.citizenReportsRouter.get('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json((0, api_1.createErrorResponse)('VALIDATION_ERROR', 'Report ID is required'));
            return;
        }
        const report = await queries_1.dbQueries.getReportById(id);
        if (!report) {
            res.status(404).json((0, api_1.createErrorResponse)('NOT_FOUND', 'Report not found'));
            return;
        }
        res.json((0, api_1.createSuccessResponse)({
            reportId: report.id,
            status: report.status,
            confidence: report.classification.confidence,
            hazardType: report.classification.hazardType,
            severity: report.classification.severity,
            aiSummary: report.aiSummary,
            timestamp: report.timestamp,
            updatedAt: report.updatedAt,
        }));
    }
    catch (error) {
        logger_1.logger.error('Error fetching report status:', error);
        res.status(500).json((0, api_1.createErrorResponse)('INTERNAL_ERROR', 'Failed to fetch report status'));
    }
});
// Error handler for multer
exports.citizenReportsRouter.use((err, _req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json((0, api_1.createErrorResponse)('VALIDATION_ERROR', 'File too large', `Maximum file size is ${maxFileSize / 1024 / 1024}MB`));
            return;
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            res.status(400).json((0, api_1.createErrorResponse)('VALIDATION_ERROR', 'Too many files', 'Maximum 5 files allowed'));
            return;
        }
        res.status(400).json((0, api_1.createErrorResponse)('VALIDATION_ERROR', 'File upload error', err.message));
        return;
    }
    next(err);
});
exports.citizenReportsModule = {
    router: exports.citizenReportsRouter,
};
exports.default = exports.citizenReportsModule;
//# sourceMappingURL=citizen-reports.js.map