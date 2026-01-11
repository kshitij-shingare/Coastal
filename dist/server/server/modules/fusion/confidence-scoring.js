"use strict";
/**
 * Confidence Scoring Service
 *
 * Calculates confidence scores for alerts based on multiple factors.
 * Validates: Requirements 8.2
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.confidenceScoringService = void 0;
exports.calculateConfidenceScore = calculateConfidenceScore;
exports.determineSeverity = determineSeverity;
exports.calculateAlertPriority = calculateAlertPriority;
// Weights for different confidence factors
const FACTOR_WEIGHTS = {
    sourceCount: 0.20,
    sourceDiversity: 0.20,
    temporalConsistency: 0.15,
    spatialConsistency: 0.15,
    mediaEvidence: 0.15,
    aiConfidence: 0.15,
};
// Source type reliability scores
const SOURCE_RELIABILITY = {
    citizen: 0.6,
    social: 0.5,
    official: 1.0,
};
/**
 * Calculate confidence score based on number of corroborating reports
 */
function calculateSourceCountScore(reportCount) {
    // Logarithmic scaling: more reports = higher confidence, but diminishing returns
    if (reportCount <= 0)
        return 0;
    if (reportCount === 1)
        return 30;
    if (reportCount === 2)
        return 50;
    if (reportCount <= 5)
        return 60 + (reportCount - 2) * 5;
    if (reportCount <= 10)
        return 75 + (reportCount - 5) * 2;
    return Math.min(90, 85 + Math.log10(reportCount - 9) * 5);
}
/**
 * Calculate score based on diversity of report sources
 *
 * This function ensures monotonicity: adding a report from a new source type
 * will always increase or maintain the score (never decrease it).
 *
 * The score is calculated as:
 * - Base score from total reliability of all unique source types (additive)
 * - Diversity bonus for having multiple source types
 *
 * This ensures that adding any new source type adds to the total reliability
 * and increases the diversity bonus, guaranteeing monotonicity.
 */
function calculateSourceDiversityScore(reports) {
    const sourceTypes = new Set(reports.map(r => r.source));
    const uniqueSources = sourceTypes.size;
    // Calculate total reliability (additive, not averaged)
    // This ensures adding any source type increases or maintains the score
    let totalReliability = 0;
    for (const source of sourceTypes) {
        totalReliability += SOURCE_RELIABILITY[source] || 0.5;
    }
    // Maximum possible total reliability is 2.1 (citizen: 0.6 + social: 0.5 + official: 1.0)
    // Normalize to 0-60 range based on total reliability
    const maxTotalReliability = 2.1;
    const reliabilityScore = (totalReliability / maxTotalReliability) * 60;
    // Diversity bonus: more unique source types = higher bonus
    // This is additive and always increases with more source types
    const diversityBonus = Math.min(uniqueSources * 15, 40);
    return Math.min(reliabilityScore + diversityBonus, 100);
}
/**
 * Calculate temporal consistency score
 * Higher score if reports are clustered in time (indicating real event)
 */
function calculateTemporalConsistencyScore(reports) {
    if (reports.length < 2)
        return 50;
    const timestamps = reports.map(r => new Date(r.timestamp).getTime()).sort((a, b) => a - b);
    const timeSpan = timestamps[timestamps.length - 1] - timestamps[0];
    const avgInterval = timeSpan / (timestamps.length - 1);
    // Events within 1 hour are highly consistent
    const oneHour = 60 * 60 * 1000;
    const sixHours = 6 * oneHour;
    const oneDay = 24 * oneHour;
    if (avgInterval < oneHour)
        return 95;
    if (avgInterval < sixHours)
        return 80;
    if (avgInterval < oneDay)
        return 60;
    return 40;
}
/**
 * Calculate spatial consistency score
 * Higher score if reports are geographically clustered
 */
function calculateSpatialConsistencyScore(reports) {
    if (reports.length < 2)
        return 50;
    // Calculate centroid
    const lats = reports.map(r => r.location.latitude);
    const lngs = reports.map(r => r.location.longitude);
    const centroidLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const centroidLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
    // Calculate average distance from centroid (in km)
    const distances = reports.map(r => haversineDistance(r.location.latitude, r.location.longitude, centroidLat, centroidLng));
    const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
    // Score based on clustering
    if (avgDistance < 1)
        return 95; // Within 1km
    if (avgDistance < 5)
        return 85; // Within 5km
    if (avgDistance < 10)
        return 70; // Within 10km
    if (avgDistance < 25)
        return 55; // Within 25km
    return 40;
}
/**
 * Calculate Haversine distance between two points (in km)
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function toRad(deg) {
    return deg * (Math.PI / 180);
}
/**
 * Calculate media evidence score
 */
function calculateMediaEvidenceScore(reports) {
    const reportsWithMedia = reports.filter(r => r.content.mediaFiles && r.content.mediaFiles.length > 0);
    if (reportsWithMedia.length === 0)
        return 30;
    const mediaRatio = reportsWithMedia.length / reports.length;
    const totalMediaFiles = reports.reduce((sum, r) => sum + (r.content.mediaFiles?.length || 0), 0);
    // Base score from ratio + bonus for multiple media files
    return Math.min(40 + mediaRatio * 40 + Math.min(totalMediaFiles * 2, 20), 100);
}
/**
 * Calculate average AI confidence from reports
 */
function calculateAIConfidenceScore(reports) {
    const confidences = reports
        .map(r => r.classification.confidence)
        .filter(c => c > 0);
    if (confidences.length === 0)
        return 50;
    return confidences.reduce((a, b) => a + b, 0) / confidences.length;
}
/**
 * Calculate comprehensive confidence score for a set of reports
 */
function calculateConfidenceScore(reports) {
    if (reports.length === 0) {
        return {
            overall: 0,
            factors: {
                sourceCount: 0,
                sourceDiversity: 0,
                temporalConsistency: 0,
                spatialConsistency: 0,
                mediaEvidence: 0,
                aiConfidence: 0,
            },
            breakdown: ['No reports to analyze'],
        };
    }
    const factors = {
        sourceCount: calculateSourceCountScore(reports.length),
        sourceDiversity: calculateSourceDiversityScore(reports),
        temporalConsistency: calculateTemporalConsistencyScore(reports),
        spatialConsistency: calculateSpatialConsistencyScore(reports),
        mediaEvidence: calculateMediaEvidenceScore(reports),
        aiConfidence: calculateAIConfidenceScore(reports),
    };
    // Calculate weighted overall score
    const overall = Math.round(factors.sourceCount * FACTOR_WEIGHTS.sourceCount +
        factors.sourceDiversity * FACTOR_WEIGHTS.sourceDiversity +
        factors.temporalConsistency * FACTOR_WEIGHTS.temporalConsistency +
        factors.spatialConsistency * FACTOR_WEIGHTS.spatialConsistency +
        factors.mediaEvidence * FACTOR_WEIGHTS.mediaEvidence +
        factors.aiConfidence * FACTOR_WEIGHTS.aiConfidence);
    // Generate breakdown explanation
    const breakdown = [];
    breakdown.push(`${reports.length} corroborating report(s) (${Math.round(factors.sourceCount)}%)`);
    const sourceTypes = new Set(reports.map(r => r.source));
    breakdown.push(`${sourceTypes.size} unique source type(s) (${Math.round(factors.sourceDiversity)}%)`);
    if (factors.temporalConsistency >= 80) {
        breakdown.push('Reports are temporally clustered (high consistency)');
    }
    if (factors.spatialConsistency >= 80) {
        breakdown.push('Reports are geographically clustered (high consistency)');
    }
    const mediaCount = reports.reduce((sum, r) => sum + (r.content.mediaFiles?.length || 0), 0);
    if (mediaCount > 0) {
        breakdown.push(`${mediaCount} media file(s) attached`);
    }
    return { overall, factors, breakdown };
}
/**
 * Determine severity based on confidence and report characteristics
 */
function determineSeverity(reports, confidence) {
    // Check if any report indicates high severity
    const severityCounts = { high: 0, moderate: 0, low: 0 };
    for (const report of reports) {
        const severity = report.classification.severity || 'moderate';
        severityCounts[severity]++;
    }
    // Weighted voting with confidence adjustment
    if (severityCounts.high >= reports.length * 0.3 && confidence >= 60) {
        return 'high';
    }
    if (severityCounts.high + severityCounts.moderate >= reports.length * 0.5) {
        return confidence >= 70 ? 'high' : 'moderate';
    }
    if (severityCounts.low >= reports.length * 0.7) {
        return 'low';
    }
    return 'moderate';
}
/**
 * Calculate priority score for alert ordering
 */
function calculateAlertPriority(alert) {
    const severityScores = {
        high: 100,
        moderate: 60,
        low: 30,
    };
    const statusScores = {
        active: 50,
        verified: 40,
        resolved: 10,
        false_alarm: 0,
    };
    const severityScore = severityScores[alert.severity] || 60;
    const statusScore = statusScores[alert.status] || 25;
    const confidenceScore = alert.confidence * 0.3;
    // Recency bonus (alerts from last hour get boost)
    const ageHours = (Date.now() - new Date(alert.timestamp).getTime()) / (1000 * 60 * 60);
    const recencyBonus = ageHours < 1 ? 20 : ageHours < 6 ? 10 : 0;
    return severityScore + statusScore + confidenceScore + recencyBonus;
}
exports.confidenceScoringService = {
    calculateConfidenceScore,
    determineSeverity,
    calculateAlertPriority,
    haversineDistance,
};
exports.default = exports.confidenceScoringService;
//# sourceMappingURL=confidence-scoring.js.map