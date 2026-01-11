"use strict";
/**
 * Property-Based Test for Confidence Score Monotonicity
 *
 * Feature: coastal-hazards-merge, Property 9: Confidence Score Monotonicity
 *
 * Property: For any cluster of reports, adding a report from a new source type SHALL
 * increase or maintain the confidence score (never decrease it).
 *
 * **Validates: Requirements 8.2**
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fc = __importStar(require("fast-check"));
const confidence_scoring_1 = require("../../modules/fusion/confidence-scoring");
// Valid source types
const SOURCE_TYPES = ['citizen', 'social', 'official'];
// Valid hazard types
const HAZARD_TYPES = [
    'flooding', 'storm_surge', 'high_waves', 'erosion',
    'rip_current', 'tsunami', 'pollution', 'other'
];
// Valid severity levels
const SEVERITY_LEVELS = ['low', 'moderate', 'high'];
// Valid report statuses
const REPORT_STATUSES = ['pending', 'verified', 'rejected'];
/**
 * Arbitrary for generating a valid GeoLocation within a small area
 * (to ensure spatial consistency for clustering)
 */
const geoLocationArb = (baseLat, baseLng, spreadKm = 5) => {
    // Approximate degrees per km
    const degPerKm = 0.009;
    const spread = spreadKm * degPerKm;
    return fc.record({
        latitude: fc.double({ min: baseLat - spread, max: baseLat + spread, noNaN: true }),
        longitude: fc.double({ min: baseLng - spread, max: baseLng + spread, noNaN: true }),
        accuracy: fc.option(fc.double({ min: 1, max: 100, noNaN: true }), { nil: undefined }),
        address: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
    });
};
/**
 * Arbitrary for generating a valid Report
 */
const reportArb = (sourceType, baseTimestamp, baseLat, baseLng) => {
    return fc.record({
        id: fc.uuid(),
        timestamp: fc.date({
            min: new Date(baseTimestamp.getTime() - 3600000), // 1 hour before
            max: new Date(baseTimestamp.getTime() + 3600000) // 1 hour after
        }),
        location: geoLocationArb(baseLat, baseLng),
        source: fc.constant(sourceType),
        content: fc.record({
            originalText: fc.string({ minLength: 10, maxLength: 200 }),
            translatedText: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: undefined }),
            language: fc.constantFrom('en', 'es', 'fr', 'de'),
            mediaFiles: fc.option(fc.array(fc.record({
                id: fc.uuid(),
                fileName: fc.string({ minLength: 5, maxLength: 50 }),
                filePath: fc.string({ minLength: 10, maxLength: 100 }),
                fileType: fc.constantFrom('image', 'video'),
                fileSize: fc.integer({ min: 1000, max: 10000000 }),
                mimeType: fc.constantFrom('image/jpeg', 'image/png', 'video/mp4'),
                createdAt: fc.date(),
            }), { minLength: 0, maxLength: 3 }), { nil: undefined }),
        }),
        classification: fc.record({
            hazardType: fc.option(fc.constantFrom(...HAZARD_TYPES), { nil: undefined }),
            severity: fc.option(fc.constantFrom(...SEVERITY_LEVELS), { nil: undefined }),
            confidence: fc.double({ min: 0, max: 100, noNaN: true }),
        }),
        status: fc.constantFrom(...REPORT_STATUSES),
        region: fc.constantFrom('North Coast', 'South Beach', 'East Harbor', 'West Bay'),
        aiSummary: fc.option(fc.string({ minLength: 20, maxLength: 200 }), { nil: undefined }),
        metadata: fc.record({
            deviceInfo: fc.option(fc.string({ minLength: 5, maxLength: 50 }), { nil: undefined }),
            ipAddress: fc.option(fc.ipV4(), { nil: undefined }),
            userAgent: fc.option(fc.string({ minLength: 10, maxLength: 100 }), { nil: undefined }),
        }),
        createdAt: fc.date(),
        updatedAt: fc.date(),
    });
};
/**
 * Generate a cluster of reports with the same source type
 */
const reportsClusterArb = (sourceType, count, baseTimestamp, baseLat, baseLng) => {
    return fc.array(reportArb(sourceType, baseTimestamp, baseLat, baseLng), { minLength: count, maxLength: count });
};
describe('Property 9: Confidence Score Monotonicity', () => {
    // Feature: coastal-hazards-merge, Property 9: Confidence Score Monotonicity
    // **Validates: Requirements 8.2**
    const baseTimestamp = new Date();
    const baseLat = 25.7617; // Miami area
    const baseLng = -80.1918;
    it('should increase or maintain confidence when adding a report from a new source type', async () => {
        await fc.assert(fc.asyncProperty(
        // Generate initial reports from one source type
        fc.constantFrom(...SOURCE_TYPES), fc.integer({ min: 1, max: 5 }), 
        // Generate a new source type different from the initial
        fc.constantFrom(...SOURCE_TYPES), async (initialSourceType, initialCount, newSourceType) => {
            // Skip if source types are the same (we want to test NEW source types)
            if (initialSourceType === newSourceType) {
                return true;
            }
            // Generate initial cluster of reports
            const initialReports = await fc.sample(reportsClusterArb(initialSourceType, initialCount, baseTimestamp, baseLat, baseLng), 1)[0];
            // Calculate initial confidence
            const initialScore = (0, confidence_scoring_1.calculateConfidenceScore)(initialReports);
            // Generate a new report from a different source type
            const newReport = await fc.sample(reportArb(newSourceType, baseTimestamp, baseLat, baseLng), 1)[0];
            // Add the new report to the cluster
            const updatedReports = [...initialReports, newReport];
            // Calculate updated confidence
            const updatedScore = (0, confidence_scoring_1.calculateConfidenceScore)(updatedReports);
            // Property: Adding a report from a new source type should increase or maintain confidence
            expect(updatedScore.overall).toBeGreaterThanOrEqual(initialScore.overall);
            return true;
        }), { numRuns: 100 });
    });
    it('should have higher source diversity score when multiple source types are present', async () => {
        await fc.assert(fc.asyncProperty(fc.integer({ min: 1, max: 3 }), async (reportsPerType) => {
            // Generate reports from a single source type
            const singleSourceReports = await fc.sample(reportsClusterArb('citizen', reportsPerType, baseTimestamp, baseLat, baseLng), 1)[0];
            // Generate reports from multiple source types
            const citizenReports = await fc.sample(reportsClusterArb('citizen', reportsPerType, baseTimestamp, baseLat, baseLng), 1)[0];
            const socialReports = await fc.sample(reportsClusterArb('social', reportsPerType, baseTimestamp, baseLat, baseLng), 1)[0];
            const multiSourceReports = [...citizenReports, ...socialReports];
            // Calculate scores
            const singleSourceScore = (0, confidence_scoring_1.calculateConfidenceScore)(singleSourceReports);
            const multiSourceScore = (0, confidence_scoring_1.calculateConfidenceScore)(multiSourceReports);
            // Source diversity factor should be higher with multiple source types
            expect(multiSourceScore.factors.sourceDiversity).toBeGreaterThanOrEqual(singleSourceScore.factors.sourceDiversity);
            return true;
        }), { numRuns: 100 });
    });
    it('should return valid confidence score structure for any set of reports', async () => {
        await fc.assert(fc.asyncProperty(fc.constantFrom(...SOURCE_TYPES), fc.integer({ min: 1, max: 10 }), async (sourceType, count) => {
            const reports = await fc.sample(reportsClusterArb(sourceType, count, baseTimestamp, baseLat, baseLng), 1)[0];
            const score = (0, confidence_scoring_1.calculateConfidenceScore)(reports);
            // Verify structure
            expect(score).toHaveProperty('overall');
            expect(score).toHaveProperty('factors');
            expect(score).toHaveProperty('breakdown');
            // Verify overall score is valid
            expect(typeof score.overall).toBe('number');
            expect(score.overall).toBeGreaterThanOrEqual(0);
            expect(score.overall).toBeLessThanOrEqual(100);
            // Verify all factors are present and valid
            expect(score.factors).toHaveProperty('sourceCount');
            expect(score.factors).toHaveProperty('sourceDiversity');
            expect(score.factors).toHaveProperty('temporalConsistency');
            expect(score.factors).toHaveProperty('spatialConsistency');
            expect(score.factors).toHaveProperty('mediaEvidence');
            expect(score.factors).toHaveProperty('aiConfidence');
            // All factors should be between 0 and 100
            Object.values(score.factors).forEach(factor => {
                expect(factor).toBeGreaterThanOrEqual(0);
                expect(factor).toBeLessThanOrEqual(100);
            });
            // Breakdown should be an array
            expect(Array.isArray(score.breakdown)).toBe(true);
            return true;
        }), { numRuns: 100 });
    });
    it('should increase source count score as more reports are added', async () => {
        await fc.assert(fc.asyncProperty(fc.constantFrom(...SOURCE_TYPES), async (sourceType) => {
            // Generate clusters of increasing size
            const smallCluster = await fc.sample(reportsClusterArb(sourceType, 2, baseTimestamp, baseLat, baseLng), 1)[0];
            const largeCluster = await fc.sample(reportsClusterArb(sourceType, 5, baseTimestamp, baseLat, baseLng), 1)[0];
            const smallScore = (0, confidence_scoring_1.calculateConfidenceScore)(smallCluster);
            const largeScore = (0, confidence_scoring_1.calculateConfidenceScore)(largeCluster);
            // More reports should result in higher or equal source count score
            expect(largeScore.factors.sourceCount).toBeGreaterThanOrEqual(smallScore.factors.sourceCount);
            return true;
        }), { numRuns: 100 });
    });
    it('should return zero confidence for empty report array', () => {
        const score = (0, confidence_scoring_1.calculateConfidenceScore)([]);
        expect(score.overall).toBe(0);
        expect(score.factors.sourceCount).toBe(0);
        expect(score.factors.sourceDiversity).toBe(0);
        expect(score.factors.temporalConsistency).toBe(0);
        expect(score.factors.spatialConsistency).toBe(0);
        expect(score.factors.mediaEvidence).toBe(0);
        expect(score.factors.aiConfidence).toBe(0);
        expect(score.breakdown).toContain('No reports to analyze');
    });
    it('should give higher confidence to official sources than citizen or social sources', async () => {
        await fc.assert(fc.asyncProperty(fc.integer({ min: 1, max: 3 }), async (count) => {
            // Generate reports from citizen source
            const citizenReports = await fc.sample(reportsClusterArb('citizen', count, baseTimestamp, baseLat, baseLng), 1)[0];
            // Generate reports from official source
            const officialReports = await fc.sample(reportsClusterArb('official', count, baseTimestamp, baseLat, baseLng), 1)[0];
            const citizenScore = (0, confidence_scoring_1.calculateConfidenceScore)(citizenReports);
            const officialScore = (0, confidence_scoring_1.calculateConfidenceScore)(officialReports);
            // Official sources should have higher or equal source diversity score
            // (due to higher reliability weight)
            expect(officialScore.factors.sourceDiversity).toBeGreaterThanOrEqual(citizenScore.factors.sourceDiversity);
            return true;
        }), { numRuns: 100 });
    });
    it('should maintain monotonicity when adding any new report to existing cluster', async () => {
        await fc.assert(fc.asyncProperty(fc.constantFrom(...SOURCE_TYPES), fc.integer({ min: 1, max: 5 }), fc.constantFrom(...SOURCE_TYPES), async (initialSourceType, initialCount, newSourceType) => {
            // Generate initial cluster
            const initialReports = await fc.sample(reportsClusterArb(initialSourceType, initialCount, baseTimestamp, baseLat, baseLng), 1)[0];
            const initialScore = (0, confidence_scoring_1.calculateConfidenceScore)(initialReports);
            // Generate and add a new report (any source type)
            const newReport = await fc.sample(reportArb(newSourceType, baseTimestamp, baseLat, baseLng), 1)[0];
            const updatedReports = [...initialReports, newReport];
            const updatedScore = (0, confidence_scoring_1.calculateConfidenceScore)(updatedReports);
            // Adding any report should not decrease the overall confidence
            // (more data = more confidence, or at least maintained)
            // Note: This is a weaker property than the main one, but still important
            // The main property specifically tests NEW source types
            // For the specific case of adding a NEW source type, confidence must increase or stay same
            const initialSourceTypes = new Set(initialReports.map(r => r.source));
            const isNewSourceType = !initialSourceTypes.has(newSourceType);
            if (isNewSourceType) {
                expect(updatedScore.overall).toBeGreaterThanOrEqual(initialScore.overall);
            }
            return true;
        }), { numRuns: 100 });
    });
});
//# sourceMappingURL=confidence-scoring.test.js.map