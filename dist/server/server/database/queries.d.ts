import { Report, HazardType, SeverityLevel, ReportStatus } from '../../shared/types/report';
import { Alert, AlertStatus } from '../../shared/types/alert';
import { SystemStats } from '../../shared/types/api';
export declare function getRecentReports(limit?: number): Promise<Report[]>;
export declare function getReportById(id: string): Promise<Report | null>;
export declare function getReportsByLocation(latitude: number, longitude: number, radiusKm?: number): Promise<Report[]>;
export declare function getReportsPaginated(page?: number, limit?: number, filters?: {
    status?: ReportStatus;
    hazardType?: HazardType;
    severity?: SeverityLevel;
    region?: string;
    startDate?: Date;
    endDate?: Date;
}): Promise<{
    reports: Report[];
    total: number;
}>;
export declare function createReport(report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>): Promise<Report>;
export declare function updateReportStatus(id: string, status: ReportStatus, confidence?: number): Promise<Report | null>;
export declare function getActiveAlerts(): Promise<Alert[]>;
export declare function getAlertById(id: string): Promise<Alert | null>;
export declare function getAlertsPaginated(page?: number, limit?: number, filters?: {
    status?: AlertStatus;
    hazardType?: HazardType;
    severity?: SeverityLevel;
    region?: string;
    minConfidence?: number;
}): Promise<{
    alerts: Alert[];
    total: number;
}>;
export declare function createAlert(alert: Omit<Alert, 'id' | 'createdAt' | 'updatedAt'>): Promise<Alert>;
export declare function updateAlertStatus(id: string, status: AlertStatus): Promise<Alert | null>;
export declare function getSystemStats(): Promise<SystemStats>;
export declare function healthCheck(): Promise<boolean>;
export declare const dbQueries: {
    getRecentReports: typeof getRecentReports;
    getReportById: typeof getReportById;
    getReportsByLocation: typeof getReportsByLocation;
    getReportsPaginated: typeof getReportsPaginated;
    createReport: typeof createReport;
    updateReportStatus: typeof updateReportStatus;
    getActiveAlerts: typeof getActiveAlerts;
    getAlertById: typeof getAlertById;
    getAlertsPaginated: typeof getAlertsPaginated;
    createAlert: typeof createAlert;
    updateAlertStatus: typeof updateAlertStatus;
    getSystemStats: typeof getSystemStats;
    healthCheck: typeof healthCheck;
};
export default dbQueries;
//# sourceMappingURL=queries.d.ts.map