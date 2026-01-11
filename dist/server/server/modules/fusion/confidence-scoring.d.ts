/**
 * Confidence Scoring Service
 *
 * Calculates confidence scores for alerts based on multiple factors.
 * Validates: Requirements 8.2
 */
import { Report, SeverityLevel } from '../../../shared/types/report';
import { Alert } from '../../../shared/types/alert';
export interface ConfidenceFactors {
    sourceCount: number;
    sourceDiversity: number;
    temporalConsistency: number;
    spatialConsistency: number;
    mediaEvidence: number;
    aiConfidence: number;
}
export interface ConfidenceScore {
    overall: number;
    factors: ConfidenceFactors;
    breakdown: string[];
}
/**
 * Calculate Haversine distance between two points (in km)
 */
declare function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
/**
 * Calculate comprehensive confidence score for a set of reports
 */
export declare function calculateConfidenceScore(reports: Report[]): ConfidenceScore;
/**
 * Determine severity based on confidence and report characteristics
 */
export declare function determineSeverity(reports: Report[], confidence: number): SeverityLevel;
/**
 * Calculate priority score for alert ordering
 */
export declare function calculateAlertPriority(alert: Alert): number;
export declare const confidenceScoringService: {
    calculateConfidenceScore: typeof calculateConfidenceScore;
    determineSeverity: typeof determineSeverity;
    calculateAlertPriority: typeof calculateAlertPriority;
    haversineDistance: typeof haversineDistance;
};
export default confidenceScoringService;
//# sourceMappingURL=confidence-scoring.d.ts.map