/**
 * Citizen Reports Ingestion Module
 * 
 * Handles submission and validation of citizen hazard reports.
 * Validates: Requirements 4.1, 4.5
 */

import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';
import { dbQueries } from '../../database/queries';
import { cacheManager } from '../../cache/cache-manager';
import { createSuccessResponse, createErrorResponse } from '../../../shared/types/api';
import { Report, HazardType, SeverityLevel, SourceType, isValidHazardType } from '../../../shared/types/report';
import { rateLimitMiddleware, reportSubmitRateLimiter, ValidationError } from '../../utils/error-handling';

// Create router
export const citizenReportsRouter = express.Router();

// Configure multer for file uploads
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10); // 10MB default

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSize,
    files: 5, // Max 5 files per upload
  },
  fileFilter,
});

// Validation schema for report submission
const reportSubmissionSchema = Joi.object({
  description: Joi.string().min(10).max(5000).required().messages({
    'string.min': 'Description must be at least 10 characters',
    'string.max': 'Description must not exceed 5000 characters',
    'any.required': 'Description is required',
  }),
  latitude: Joi.number().min(-90).max(90).required().messages({
    'number.min': 'Latitude must be between -90 and 90',
    'number.max': 'Latitude must be between -90 and 90',
    'any.required': 'Latitude is required',
  }),
  longitude: Joi.number().min(-180).max(180).required().messages({
    'number.min': 'Longitude must be between -180 and 180',
    'number.max': 'Longitude must be between -180 and 180',
    'any.required': 'Longitude is required',
  }),
  address: Joi.string().max(500).optional(),
  hazardType: Joi.string().valid(
    'flooding', 'storm_surge', 'high_waves', 'erosion', 'rip_current', 'tsunami', 'pollution', 'other'
  ).optional(),
  severity: Joi.string().valid('low', 'moderate', 'high').optional(),
  language: Joi.string().max(10).default('en'),
});

// Helper to determine region from coordinates
function getRegionFromCoordinates(lat: number, lng: number): string {
  // India coastal regions mapping (simplified)
  if (lat > 20 && lng < 74) return 'Gujarat Coast';
  if (lat > 15 && lat <= 20 && lng < 74) return 'Maharashtra Coast';
  if (lat > 12 && lat <= 15 && lng < 76) return 'Karnataka Coast';
  if (lat > 8 && lat <= 12 && lng < 77) return 'Kerala Coast';
  if (lat > 8 && lat <= 13 && lng >= 77 && lng < 80) return 'Tamil Nadu Coast';
  if (lat > 13 && lat <= 16 && lng >= 80) return 'Andhra Pradesh Coast';
  if (lat > 16 && lat <= 22 && lng >= 82) return 'Odisha Coast';
  if (lat > 21 && lng >= 87) return 'West Bengal Coast';
  return 'Unknown Region';
}

// Apply rate limiting to report submission
citizenReportsRouter.use('/submit', rateLimitMiddleware(reportSubmitRateLimiter));

/**
 * POST /api/reports/submit
 * Submit a new citizen report
 */
citizenReportsRouter.post(
  '/submit',
  upload.array('media', 5),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request body
      const { error, value } = reportSubmissionSchema.validate(req.body, { abortEarly: false });
      
      if (error) {
        const errorMessages = error.details.map(d => d.message).join(', ');
        res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Validation failed', errorMessages));
        return;
      }

      const { description, latitude, longitude, address, hazardType, severity, language } = value;

      // Get uploaded files
      const files = req.files as Express.Multer.File[] | undefined;
      const mediaFiles = files?.map(file => ({
        id: uuidv4(),
        fileName: file.originalname,
        filePath: file.path,
        fileType: file.mimetype.split('/')[0], // 'image' or 'video'
        fileSize: file.size,
        mimeType: file.mimetype,
        createdAt: new Date(),
      }));

      // Create report object
      const report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'> = {
        timestamp: new Date(),
        location: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          address: address || undefined,
        },
        source: 'citizen' as SourceType,
        content: {
          originalText: description,
          language: language || 'en',
          mediaFiles: mediaFiles,
        },
        classification: {
          hazardType: hazardType as HazardType | undefined,
          severity: severity as SeverityLevel | undefined,
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
      const savedReport = await dbQueries.createReport(report);

      // Invalidate cache
      await cacheManager.invalidateRecentReports();
      await cacheManager.invalidateDashboardData();
      await cacheManager.invalidateSystemStats();

      logger.info('New citizen report submitted', {
        reportId: savedReport.id,
        region: savedReport.region,
        hazardType: savedReport.classification.hazardType,
        hasMedia: (mediaFiles?.length || 0) > 0,
      });

      // TODO: Trigger AI processing asynchronously
      // This will be implemented in the AI Processing module

      res.status(201).json(createSuccessResponse({
        message: 'Report submitted successfully',
        reportId: savedReport.id,
        status: savedReport.status,
        region: savedReport.region,
        timestamp: savedReport.timestamp,
      }));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/reports/my-reports
 * Get reports submitted by the current user (placeholder for auth)
 */
citizenReportsRouter.get('/my-reports', async (req: Request, res: Response): Promise<void> => {
  // TODO: Implement user authentication and filter by user ID
  res.json(createSuccessResponse({
    reports: [],
    message: 'Authentication required to view your reports',
  }));
});

/**
 * GET /api/reports/:id/status
 * Get the status of a specific report
 */
citizenReportsRouter.get('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Report ID is required'));
      return;
    }

    const report = await dbQueries.getReportById(id);

    if (!report) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Report not found'));
      return;
    }

    res.json(createSuccessResponse({
      reportId: report.id,
      status: report.status,
      confidence: report.classification.confidence,
      hazardType: report.classification.hazardType,
      severity: report.classification.severity,
      aiSummary: report.aiSummary,
      timestamp: report.timestamp,
      updatedAt: report.updatedAt,
    }));
  } catch (error) {
    logger.error('Error fetching report status:', error);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to fetch report status'));
  }
});

// Error handler for multer
citizenReportsRouter.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'File too large', `Maximum file size is ${maxFileSize / 1024 / 1024}MB`));
      return;
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Too many files', 'Maximum 5 files allowed'));
      return;
    }
    res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'File upload error', err.message));
    return;
  }
  next(err);
});

export const citizenReportsModule = {
  router: citizenReportsRouter,
};

export default citizenReportsModule;
