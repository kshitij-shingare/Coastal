/**
 * Fusion Engine
 *
 * Clusters reports, generates alerts, and handles deduplication.
 * Validates: Requirements 8.1, 8.3, 8.4, 8.5
 */
import { Report, HazardType, SeverityLevel } from '../../../shared/types/report';
import { Alert } from '../../../shared/types/alert';
export interface ReportCluster {
    id: string;
    reports: Report[];
    centroid: {
        latitude: number;
        longitude: number;
    };
    hazardType: HazardType;
    severity: SeverityLevel;
    confidence: number;
    region: string;
    startTime: Date;
    endTime: Date;
}
export interface FusionResult {
    clusters: ReportCluster[];
    newAlerts: Alert[];
    updatedAlerts: Alert[];
    processedReportIds: string[];
}
/**
 * Cluster reports using DBSCAN-like algorithm
 */
declare function clusterReports(reports: Report[]): ReportCluster[];
/**
 * Create alert from cluster
 */
declare function createAlertFromCluster(cluster: ReportCluster): Alert;
/**
 * Generate safety recommendations based on hazard type and severity
 */
declare function generateRecommendations(hazardType: HazardType, severity: SeverityLevel): string[];
/**
 * Main fusion process - cluster reports and generate/update alerts
 */
export declare function processReports(reports: Report[]): Promise<FusionResult>;
/**
 * Run fusion on recent unprocessed reports
 */
export declare function runFusionCycle(): Promise<FusionResult>;
export declare const fusionEngine: {
    processReports: typeof processReports;
    runFusionCycle: typeof runFusionCycle;
    clusterReports: typeof clusterReports;
    createAlertFromCluster: typeof createAlertFromCluster;
    generateRecommendations: typeof generateRecommendations;
};
export default fusionEngine;
//# sourceMappingURL=fusion-engine.d.ts.map