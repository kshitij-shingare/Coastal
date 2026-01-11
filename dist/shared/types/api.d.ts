import { HazardType, SeverityLevel, ReportStatus } from './report';
import { AlertStatus } from './alert';
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
    radius?: number;
}
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
export declare function createSuccessResponse<T>(data: T): ApiResponse<T>;
export declare function createErrorResponse(code: string, message: string, details?: string): ApiResponse<never>;
export declare function validatePaginationParams(params: PaginationParams): string[];
//# sourceMappingURL=api.d.ts.map