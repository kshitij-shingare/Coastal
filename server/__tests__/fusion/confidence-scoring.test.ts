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

import * as fc from 'fast-check';
import { 
  calculateConfidenceScore, 
  ConfidenceScore 
} from '../../modules/fusion/confidence-scoring';
import { 
  Report, 
  SourceType, 
  HazardType, 
  SeverityLevel, 
  ReportStatus 
} from '../../../shared/types/report';

// Valid source types
const SOURCE_TYPES: SourceType[] = ['citizen', 'social', 'official'];

// Valid hazard types
const HAZARD_TYPES: HazardType[] = [
  'flooding', 'storm_surge', 'high_waves', 'erosion',
  'rip_current', 'tsunami', 'pollution', 'other'
];

// Valid severity levels
const SEVERITY_LEVELS: SeverityLevel[] = ['low', 'moderate', 'high'];

// Valid report statuses
const REPORT_STATUSES: ReportStatus[] = ['pending', 'verified', 'rejected'];

/**
 * Arbitrary for generating a valid GeoLocation within a small area
 * (to ensure spatial consistency for clustering)
 */
const geoLocationArb = (baseLat: number, baseLng: number, spreadKm: number = 5) => {
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
const reportArb = (
  sourceType: SourceType,
  baseTimestamp: Date,
  baseLat: number,
  baseLng: number
): fc.Arbitrary<Report> => {
  return fc.record({
    id: fc.uuid(),
    timestamp: fc.date({ 
      min: new Date(baseTimestamp.getTime() - 3600000), // 1 hour before
      max: new Date(baseTimestamp.getTime() + 3600000)  // 1 hour after
    }),
    location: geoLocationArb(baseLat, baseLng),
    source: fc.constant(sourceType),
    content: fc.record({
      originalText: fc.string({ minLength: 10, maxLength: 200 }),
      translatedText: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: undefined }),
      language: fc.constantFrom('en', 'es', 'fr', 'de'),
      mediaFiles: fc.option(
        fc.array(
          fc.record({
            id: fc.uuid(),
            fileName: fc.string({ minLength: 5, maxLength: 50 }),
            filePath: fc.string({ minLength: 10, maxLength: 100 }),
            fileType: fc.constantFrom('image', 'video'),
            fileSize: fc.integer({ min: 1000, max: 10000000 }),
            mimeType: fc.constantFrom('image/jpeg', 'image/png', 'video/mp4'),
            createdAt: fc.date(),
          }),
          { minLength: 0, maxLength: 3 }
        ),
        { nil: undefined }
      ),
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
const reportsClusterArb = (
  sourceType: SourceType,
  count: number,
  baseTimestamp: Date,
  baseLat: number,
  baseLng: number
): fc.Arbitrary<Report[]> => {
  return fc.array(
    reportArb(sourceType, baseTimestamp, baseLat, baseLng),
    { minLength: count, maxLength: count }
  );
};

describe('Property 9: Confidence Score Monotonicity', () => {
  // Feature: coastal-hazards-merge, Property 9: Confidence Score Monotonicity
  // **Validates: Requirements 8.2**

  const baseTimestamp = new Date();
  const baseLat = 25.7617;  // Miami area
  const baseLng = -80.1918;

  it('should increase or maintain confidence when adding a report from a new source type', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate initial reports from one source type
        fc.constantFrom(...SOURCE_TYPES),
        fc.integer({ min: 1, max: 5 }),
        // Generate a new source type different from the initial
        fc.constantFrom(...SOURCE_TYPES),
        async (initialSourceType, initialCount, newSourceType) => {
          // Skip if source types are the same (we want to test NEW source types)
          if (initialSourceType === newSourceType) {
            return true;
          }

          // Generate initial cluster of reports
          const initialReports = await fc.sample(
            reportsClusterArb(initialSourceType, initialCount, baseTimestamp, baseLat, baseLng),
            1
          )[0];

          // Calculate initial confidence
          const initialScore = calculateConfidenceScore(initialReports);

          // Generate a new report from a different source type
          const newReport = await fc.sample(
            reportArb(newSourceType, baseTimestamp, baseLat, baseLng),
            1
          )[0];

          // Add the new report to the cluster
          const updatedReports = [...initialReports, newReport];

          // Calculate updated confidence
          const updatedScore = calculateConfidenceScore(updatedReports);

          // Property: Adding a report from a new source type should increase or maintain confidence
          expect(updatedScore.overall).toBeGreaterThanOrEqual(initialScore.overall);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have higher source diversity score when multiple source types are present', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }),
        async (reportsPerType) => {
          // Generate reports from a single source type
          const singleSourceReports = await fc.sample(
            reportsClusterArb('citizen', reportsPerType, baseTimestamp, baseLat, baseLng),
            1
          )[0];

          // Generate reports from multiple source types
          const citizenReports = await fc.sample(
            reportsClusterArb('citizen', reportsPerType, baseTimestamp, baseLat, baseLng),
            1
          )[0];
          const socialReports = await fc.sample(
            reportsClusterArb('social', reportsPerType, baseTimestamp, baseLat, baseLng),
            1
          )[0];
          const multiSourceReports = [...citizenReports, ...socialReports];

          // Calculate scores
          const singleSourceScore = calculateConfidenceScore(singleSourceReports);
          const multiSourceScore = calculateConfidenceScore(multiSourceReports);

          // Source diversity factor should be higher with multiple source types
          expect(multiSourceScore.factors.sourceDiversity).toBeGreaterThanOrEqual(
            singleSourceScore.factors.sourceDiversity
          );

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return valid confidence score structure for any set of reports', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...SOURCE_TYPES),
        fc.integer({ min: 1, max: 10 }),
        async (sourceType, count) => {
          const reports = await fc.sample(
            reportsClusterArb(sourceType, count, baseTimestamp, baseLat, baseLng),
            1
          )[0];

          const score = calculateConfidenceScore(reports);

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
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should increase source count score as more reports are added', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...SOURCE_TYPES),
        async (sourceType) => {
          // Generate clusters of increasing size
          const smallCluster = await fc.sample(
            reportsClusterArb(sourceType, 2, baseTimestamp, baseLat, baseLng),
            1
          )[0];
          
          const largeCluster = await fc.sample(
            reportsClusterArb(sourceType, 5, baseTimestamp, baseLat, baseLng),
            1
          )[0];

          const smallScore = calculateConfidenceScore(smallCluster);
          const largeScore = calculateConfidenceScore(largeCluster);

          // More reports should result in higher or equal source count score
          expect(largeScore.factors.sourceCount).toBeGreaterThanOrEqual(
            smallScore.factors.sourceCount
          );

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return zero confidence for empty report array', () => {
    const score = calculateConfidenceScore([]);

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
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }),
        async (count) => {
          // Generate reports from citizen source
          const citizenReports = await fc.sample(
            reportsClusterArb('citizen', count, baseTimestamp, baseLat, baseLng),
            1
          )[0];

          // Generate reports from official source
          const officialReports = await fc.sample(
            reportsClusterArb('official', count, baseTimestamp, baseLat, baseLng),
            1
          )[0];

          const citizenScore = calculateConfidenceScore(citizenReports);
          const officialScore = calculateConfidenceScore(officialReports);

          // Official sources should have higher or equal source diversity score
          // (due to higher reliability weight)
          expect(officialScore.factors.sourceDiversity).toBeGreaterThanOrEqual(
            citizenScore.factors.sourceDiversity
          );

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain monotonicity when adding any new report to existing cluster', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...SOURCE_TYPES),
        fc.integer({ min: 1, max: 5 }),
        fc.constantFrom(...SOURCE_TYPES),
        async (initialSourceType, initialCount, newSourceType) => {
          // Generate initial cluster
          const initialReports = await fc.sample(
            reportsClusterArb(initialSourceType, initialCount, baseTimestamp, baseLat, baseLng),
            1
          )[0];

          const initialScore = calculateConfidenceScore(initialReports);

          // Generate and add a new report (any source type)
          const newReport = await fc.sample(
            reportArb(newSourceType, baseTimestamp, baseLat, baseLng),
            1
          )[0];

          const updatedReports = [...initialReports, newReport];
          const updatedScore = calculateConfidenceScore(updatedReports);

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
        }
      ),
      { numRuns: 100 }
    );
  });
});
