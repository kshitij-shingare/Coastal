// API type definitions - shared between frontend and backend

import { HazardType, SeverityLevel, ReportStatus } from './report';
import { AlertStatus } from './alert';

// Generic API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  timestamp: string;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}

// Query parameter types
export interface ReportQueryParams extends PaginationParams {
  status?: ReportStatus;
  hazardType?: HazardType;
  severity?: SeverityLevel;
  region?: string;
  startDate?: string;
  endDate?: string;
}

export interface AlertQueryParams extends PaginationParams {
  status?: AlertStatus;
  hazardType?: HazardType;
  severity?: SeverityLevel;
  region?: string;
  startDate?: string;
  endDate?: string;
  minConfidence?: number;
}

export interface LocationQueryParams {
  latitude: number;
  longitude: number;
  radius?: number; // in kilometers
}

// Dashboard types
export interface SystemStats {
  totalReports: number;
  activeAlerts: number;
  verifiedReports: number;
  pendingReports: number;
  reportsByRegion: Record<string, number>;
  reportsByHazardType: Record<string, number>;
  averageResponseTime?: number;
}

export interface MapDataPoint {
  latitude: number;
  longitude: number;
  intensity: number;
  hazardType: HazardType;
}

export interface AlertMarker {
  latitude: number;
  longitude: number;
  severity: SeverityLevel;
  alertId: string;
  hazardType?: HazardType;
  confidence?: number;
}

export interface MapData {
  heatmapPoints: MapDataPoint[];
  alertMarkers: AlertMarker[];
  lastUpdated: string;
}

export interface DashboardData {
  activeAlerts: unknown[];
  recentReports: unknown[];
  systemStats: SystemStats;
  mapData: {
    heatmapPoints: MapDataPoint[];
    alertMarkers: AlertMarker[];
  };
}

// Health check types
export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  service: string;
  version?: string;
  dependencies?: {
    database: 'ok' | 'down';
    redis: 'ok' | 'down';
    externalApis: 'ok' | 'down';
  };
}

// Helper functions
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}

export function createErrorResponse(code: string, message: string, details?: string): ApiResponse<never> {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  };
}

export function validatePaginationParams(params: PaginationParams): string[] {
  const errors: string[] = [];

  if (params.page !== undefined && (params.page < 1 || !Number.isInteger(params.page))) {
    errors.push('Page must be a positive integer');
  }

  if (params.limit !== undefined && (params.limit < 1 || params.limit > 100 || !Number.isInteger(params.limit))) {
    errors.push('Limit must be an integer between 1 and 100');
  }

  if (params.sortOrder !== undefined && !['asc', 'desc'].includes(params.sortOrder)) {
    errors.push('Sort order must be "asc" or "desc"');
  }

  return errors;
}
