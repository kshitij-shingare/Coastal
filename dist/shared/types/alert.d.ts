import { HazardType, SeverityLevel } from './report';
export type AlertStatus = 'active' | 'verified' | 'resolved' | 'false_alarm';
export interface GeoPolygon {
    type: 'Polygon';
    coordinates: number[][][];
}
export interface AlertRegion {
    name: string;
    bounds: GeoPolygon;
    affectedPopulation: number;
}
export interface EscalationReason {
    reportCount: number;
    sourceTypes: string[];
    timeWindow: string;
    geographicSpread: number;
    thresholdsMet: string[];
    reasoning: string;
}
export interface Alert {
    id: string;
    incidentId?: string;
    timestamp: Date;
    region: AlertRegion;
    hazardType: HazardType;
    severity: SeverityLevel;
    confidence: number;
    escalationReason: EscalationReason;
    relatedReports: string[];
    status: AlertStatus;
    aiSummary: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare function validateAlert(alert: Partial<Alert>): string[];
export declare function isValidAlertStatus(status: string): status is AlertStatus;
export declare function calculateAlertPriority(alert: Alert): number;
//# sourceMappingURL=alert.d.ts.map