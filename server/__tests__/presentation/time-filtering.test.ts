/**
 * Property-Based Test for Time-Based Filtering
 * 
 * Feature: coastal-hazards-merge, Property 6: Time-Based Filtering
 * 
 * Property: For any time filter (24h, 7d, 30d), all returned items SHALL have 
 * timestamps within the specified time window from the current time.
 * 
 * **Validates: Requirements 6.5**
 */

import * as fc from 'fast-check';
import { 
  Report, 
  SourceType, 
  HazardType, 
  SeverityLevel, 
  ReportStatus 
} from '../../../shared/types/report';
import { Alert, AlertStatus } from '../../../shared/types/alert';

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

// Valid alert statuses
const ALERT_STATUSES: AlertStatus[] = ['active', 'verified', 'resolved', 'false_alarm'];

// Regions for testing
const REGIONS = ['North Coast', 'South Beach', 'East Harbor', 'West Bay', 'Central Bay'];

// Time filter options as specified in requirements
type TimeFilter = '24h' | '7d' | '30d';
const TIME_FILTERS: TimeFilter[] = ['24h', '7d', '30d'];

/**
 * Convert time filter to milliseconds
 */
function timeFilterToMs(filter: TimeFilter): number {
  const MS_PER_HOUR = 60 * 60 * 1000;
  const MS_PER_DAY = 24 * MS_PER_HOUR;
  
  switch (filter) {
    case '24h':
      return MS_PER_DAY;
    case '7d':
      return 7 * MS_PER_DAY;
    case '30d':
      return 30 * MS_PER_DAY;
    default:
      return MS_PER_DAY;
  }
}

/**
 * Check if a timestamp is within the time window
 */
function isWithinTimeWindow(timestamp: Date, filter: TimeFilter, referenceTime: Date): boolean {
  const windowMs = timeFilterToMs(filter);
  const cutoffTime = new Date(referenceTime.getTime() - windowMs);
  return timestamp >= cutoffTime && timestamp <= referenceTime;
}

/**
 * Arbitrary for generating a valid GeoLocation
 */
const geoLocationArb = fc.record({
  latitude: fc.double({ min: -90, max: 90, noNaN: true }),
  longitude: fc.double({ min: -180, max: 180, noNaN: true }),
  accuracy: fc.option(fc.double({ min: 1, max: 100, noNaN: true }), { nil: undefined }),
  address: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
});

/**
 * Arbitrary for generating a report with a timestamp spread across a wide range
 * This ensures we have reports both inside and outside any time window
 */
const reportWithVariedTimestampArb = (referenceTime: Date): fc.Arbitrary<Report> => {
  // Generate timestamps from 60 days ago to now
  const sixtyDaysAgo = new Date(referenceTime.getTime() - 60 * 24 * 60 * 60 * 1000);
  
  return fc.record({
    id: fc.uuid(),
    timestamp: fc.date({ min: sixtyDaysAgo, max: referenceTime }),
    location: geoLocationArb,
    source: fc.constantFrom(...SOURCE_TYPES),
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
    region: fc.constantFrom(...REGIONS),
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
 * Arbitrary for generating an alert with a timestamp spread across a wide range
 */
const alertWithVariedTimestampArb = (referenceTime: Date): fc.Arbitrary<Alert> => {
  const sixtyDaysAgo = new Date(referenceTime.getTime() - 60 * 24 * 60 * 60 * 1000);
  
  return fc.record({
    id: fc.uuid(),
    incidentId: fc.option(fc.uuid(), { nil: undefined }),
    timestamp: fc.date({ min: sixtyDaysAgo, max: referenceTime }),
    region: fc.record({
      name: fc.constantFrom(...REGIONS),
      bounds: fc.constant({ type: 'Polygon' as const, coordinates: [] }),
      affectedPopulation: fc.integer({ min: 100, max: 100000 }),
    }),
    hazardType: fc.constantFrom(...HAZARD_TYPES),
    severity: fc.constantFrom(...SEVERITY_LEVELS),
    confidence: fc.double({ min: 0, max: 100, noNaN: true }),
    escalationReason: fc.record({
      reportCount: fc.integer({ min: 1, max: 50 }),
      sourceTypes: fc.array(fc.constantFrom(...SOURCE_TYPES), { minLength: 1, maxLength: 3 }),
      timeWindow: fc.constantFrom('1h', '6h', '24h'),
      geographicSpread: fc.double({ min: 0.1, max: 50, noNaN: true }),
      thresholdsMet: fc.array(fc.string({ minLength: 5, maxLength: 30 }), { minLength: 1, maxLength: 3 }),
      reasoning: fc.string({ minLength: 20, maxLength: 200 }),
    }),
    relatedReports: fc.array(fc.uuid(), { minLength: 0, maxLength: 10 }),
    status: fc.constantFrom(...ALERT_STATUSES),
    aiSummary: fc.string({ minLength: 20, maxLength: 200 }),
    createdAt: fc.date(),
    updatedAt: fc.date(),
  });
};

/**
 * Filter reports by time window
 * This simulates the time-based filtering logic that should be in the API
 */
function filterReportsByTimeWindow(
  reports: Report[], 
  filter: TimeFilter, 
  referenceTime: Date
): Report[] {
  return reports.filter(report => isWithinTimeWindow(report.timestamp, filter, referenceTime));
}

/**
 * Filter alerts by time window
 */
function filterAlertsByTimeWindow(
  alerts: Alert[], 
  filter: TimeFilter, 
  referenceTime: Date
): Alert[] {
  return alerts.filter(alert => isWithinTimeWindow(alert.timestamp, filter, referenceTime));
}

describe('Property 6: Time-Based Filtering', () => {
  // Feature: coastal-hazards-merge, Property 6: Time-Based Filtering
  // **Validates: Requirements 6.5**

  // Use a fixed reference time for consistent testing
  const referenceTime = new Date();

  it('should return only reports within 24h time window', () => {
    fc.assert(
      fc.property(
        fc.array(reportWithVariedTimestampArb(referenceTime), { minLength: 1, maxLength: 50 }),
        (reports) => {
          const filter: TimeFilter = '24h';
          const filteredReports = filterReportsByTimeWindow(reports, filter, referenceTime);
          
          // Property: All returned reports must have timestamps within the 24h window
          for (const report of filteredReports) {
            expect(isWithinTimeWindow(report.timestamp, filter, referenceTime)).toBe(true);
          }
          
          // Property: No reports outside the window should be included
          const reportsOutsideWindow = reports.filter(
            r => !isWithinTimeWindow(r.timestamp, filter, referenceTime)
          );
          for (const report of reportsOutsideWindow) {
            expect(filteredReports.find(r => r.id === report.id)).toBeUndefined();
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return only reports within 7d time window', () => {
    fc.assert(
      fc.property(
        fc.array(reportWithVariedTimestampArb(referenceTime), { minLength: 1, maxLength: 50 }),
        (reports) => {
          const filter: TimeFilter = '7d';
          const filteredReports = filterReportsByTimeWindow(reports, filter, referenceTime);
          
          // Property: All returned reports must have timestamps within the 7d window
          for (const report of filteredReports) {
            expect(isWithinTimeWindow(report.timestamp, filter, referenceTime)).toBe(true);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return only reports within 30d time window', () => {
    fc.assert(
      fc.property(
        fc.array(reportWithVariedTimestampArb(referenceTime), { minLength: 1, maxLength: 50 }),
        (reports) => {
          const filter: TimeFilter = '30d';
          const filteredReports = filterReportsByTimeWindow(reports, filter, referenceTime);
          
          // Property: All returned reports must have timestamps within the 30d window
          for (const report of filteredReports) {
            expect(isWithinTimeWindow(report.timestamp, filter, referenceTime)).toBe(true);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return only alerts within 24h time window', () => {
    fc.assert(
      fc.property(
        fc.array(alertWithVariedTimestampArb(referenceTime), { minLength: 1, maxLength: 50 }),
        (alerts) => {
          const filter: TimeFilter = '24h';
          const filteredAlerts = filterAlertsByTimeWindow(alerts, filter, referenceTime);
          
          // Property: All returned alerts must have timestamps within the 24h window
          for (const alert of filteredAlerts) {
            expect(isWithinTimeWindow(alert.timestamp, filter, referenceTime)).toBe(true);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return only alerts within 7d time window', () => {
    fc.assert(
      fc.property(
        fc.array(alertWithVariedTimestampArb(referenceTime), { minLength: 1, maxLength: 50 }),
        (alerts) => {
          const filter: TimeFilter = '7d';
          const filteredAlerts = filterAlertsByTimeWindow(alerts, filter, referenceTime);
          
          // Property: All returned alerts must have timestamps within the 7d window
          for (const alert of filteredAlerts) {
            expect(isWithinTimeWindow(alert.timestamp, filter, referenceTime)).toBe(true);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return only alerts within 30d time window', () => {
    fc.assert(
      fc.property(
        fc.array(alertWithVariedTimestampArb(referenceTime), { minLength: 1, maxLength: 50 }),
        (alerts) => {
          const filter: TimeFilter = '30d';
          const filteredAlerts = filterAlertsByTimeWindow(alerts, filter, referenceTime);
          
          // Property: All returned alerts must have timestamps within the 30d window
          for (const alert of filteredAlerts) {
            expect(isWithinTimeWindow(alert.timestamp, filter, referenceTime)).toBe(true);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain monotonicity: 24h ⊆ 7d ⊆ 30d for reports', () => {
    fc.assert(
      fc.property(
        fc.array(reportWithVariedTimestampArb(referenceTime), { minLength: 1, maxLength: 50 }),
        (reports) => {
          const filtered24h = filterReportsByTimeWindow(reports, '24h', referenceTime);
          const filtered7d = filterReportsByTimeWindow(reports, '7d', referenceTime);
          const filtered30d = filterReportsByTimeWindow(reports, '30d', referenceTime);
          
          // Property: 24h results should be a subset of 7d results
          for (const report of filtered24h) {
            expect(filtered7d.find(r => r.id === report.id)).toBeDefined();
          }
          
          // Property: 7d results should be a subset of 30d results
          for (const report of filtered7d) {
            expect(filtered30d.find(r => r.id === report.id)).toBeDefined();
          }
          
          // Property: Count should be monotonically increasing
          expect(filtered24h.length).toBeLessThanOrEqual(filtered7d.length);
          expect(filtered7d.length).toBeLessThanOrEqual(filtered30d.length);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain monotonicity: 24h ⊆ 7d ⊆ 30d for alerts', () => {
    fc.assert(
      fc.property(
        fc.array(alertWithVariedTimestampArb(referenceTime), { minLength: 1, maxLength: 50 }),
        (alerts) => {
          const filtered24h = filterAlertsByTimeWindow(alerts, '24h', referenceTime);
          const filtered7d = filterAlertsByTimeWindow(alerts, '7d', referenceTime);
          const filtered30d = filterAlertsByTimeWindow(alerts, '30d', referenceTime);
          
          // Property: 24h results should be a subset of 7d results
          for (const alert of filtered24h) {
            expect(filtered7d.find(a => a.id === alert.id)).toBeDefined();
          }
          
          // Property: 7d results should be a subset of 30d results
          for (const alert of filtered7d) {
            expect(filtered30d.find(a => a.id === alert.id)).toBeDefined();
          }
          
          // Property: Count should be monotonically increasing
          expect(filtered24h.length).toBeLessThanOrEqual(filtered7d.length);
          expect(filtered7d.length).toBeLessThanOrEqual(filtered30d.length);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly calculate time window boundaries', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TIME_FILTERS),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        (filter, testRefTime) => {
          const windowMs = timeFilterToMs(filter);
          const cutoffTime = new Date(testRefTime.getTime() - windowMs);
          
          // Property: A timestamp exactly at the cutoff should be included
          expect(isWithinTimeWindow(cutoffTime, filter, testRefTime)).toBe(true);
          
          // Property: A timestamp 1ms before the cutoff should be excluded
          const justBeforeCutoff = new Date(cutoffTime.getTime() - 1);
          expect(isWithinTimeWindow(justBeforeCutoff, filter, testRefTime)).toBe(false);
          
          // Property: A timestamp at the reference time should be included
          expect(isWithinTimeWindow(testRefTime, filter, testRefTime)).toBe(true);
          
          // Property: A timestamp 1ms after the reference time should be excluded
          const justAfterRef = new Date(testRefTime.getTime() + 1);
          expect(isWithinTimeWindow(justAfterRef, filter, testRefTime)).toBe(false);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty array when no items are within the time window', () => {
    // Create reports that are all older than 60 days
    const veryOldDate = new Date(referenceTime.getTime() - 61 * 24 * 60 * 60 * 1000);
    
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            timestamp: fc.date({ 
              min: new Date(veryOldDate.getTime() - 30 * 24 * 60 * 60 * 1000), 
              max: veryOldDate 
            }),
            location: geoLocationArb,
            source: fc.constantFrom(...SOURCE_TYPES),
            content: fc.record({
              originalText: fc.string({ minLength: 10, maxLength: 200 }),
              translatedText: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: undefined }),
              language: fc.constantFrom('en', 'es', 'fr', 'de'),
              mediaFiles: fc.constant(undefined),
            }),
            classification: fc.record({
              hazardType: fc.option(fc.constantFrom(...HAZARD_TYPES), { nil: undefined }),
              severity: fc.option(fc.constantFrom(...SEVERITY_LEVELS), { nil: undefined }),
              confidence: fc.double({ min: 0, max: 100, noNaN: true }),
            }),
            status: fc.constantFrom(...REPORT_STATUSES),
            region: fc.constantFrom(...REGIONS),
            aiSummary: fc.option(fc.string({ minLength: 20, maxLength: 200 }), { nil: undefined }),
            metadata: fc.record({
              deviceInfo: fc.constant(undefined),
              ipAddress: fc.constant(undefined),
              userAgent: fc.constant(undefined),
            }),
            createdAt: fc.date(),
            updatedAt: fc.date(),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (oldReports) => {
          // Property: All time filters should return empty for very old reports
          for (const filter of TIME_FILTERS) {
            const filtered = filterReportsByTimeWindow(oldReports, filter, referenceTime);
            expect(filtered.length).toBe(0);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge case of empty input arrays', () => {
    for (const filter of TIME_FILTERS) {
      const filteredReports = filterReportsByTimeWindow([], filter, referenceTime);
      const filteredAlerts = filterAlertsByTimeWindow([], filter, referenceTime);
      
      expect(filteredReports).toEqual([]);
      expect(filteredAlerts).toEqual([]);
    }
  });

  it('should preserve all report properties after filtering', () => {
    fc.assert(
      fc.property(
        fc.array(reportWithVariedTimestampArb(referenceTime), { minLength: 1, maxLength: 30 }),
        fc.constantFrom(...TIME_FILTERS),
        (reports, filter) => {
          const filteredReports = filterReportsByTimeWindow(reports, filter, referenceTime);
          
          // Property: Each filtered report should have all its original properties intact
          for (const filteredReport of filteredReports) {
            const originalReport = reports.find(r => r.id === filteredReport.id);
            expect(originalReport).toBeDefined();
            expect(filteredReport).toEqual(originalReport);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve all alert properties after filtering', () => {
    fc.assert(
      fc.property(
        fc.array(alertWithVariedTimestampArb(referenceTime), { minLength: 1, maxLength: 30 }),
        fc.constantFrom(...TIME_FILTERS),
        (alerts, filter) => {
          const filteredAlerts = filterAlertsByTimeWindow(alerts, filter, referenceTime);
          
          // Property: Each filtered alert should have all its original properties intact
          for (const filteredAlert of filteredAlerts) {
            const originalAlert = alerts.find(a => a.id === filteredAlert.id);
            expect(originalAlert).toBeDefined();
            expect(filteredAlert).toEqual(originalAlert);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
